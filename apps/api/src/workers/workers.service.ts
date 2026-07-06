import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Worker, SkillTag, KycStatus } from '@prisma/client';

export class CreateWorkerDto {
  name: string;
  phone: string;
  skills?: SkillTag[];
  whatsappOptIn?: boolean;
  photoUrl?: string;
}

export class UpdateWorkerDto {
  name?: string;
  phone?: string;
  skills?: SkillTag[];
  whatsappOptIn?: boolean;
  photoUrl?: string;
  isActive?: boolean;
  kycStatus?: KycStatus;
  kycDocUrls?: string[];
}

export class WorkerFilterDto {
  skills?: SkillTag[];
  kycStatus?: KycStatus;
  isActive?: boolean;
  minReliability?: number;
  limit?: number;
  offset?: number;
}

/**
 * Reliability score formula:
 *   completionRate = completedShifts / max(acceptedShifts, 1)
 *   noShowRate     = noShows / max(offeredShifts, 1)
 *   score = (completionRate * 0.6 + (1 - noShowRate) * 0.4) * 100
 *   clamped to [0, 100]
 */
export function computeReliabilityScore(params: {
  totalShiftsOffered: number;
  totalShiftsAccepted: number;
  totalShiftsCompleted: number;
  totalNoShows: number;
}): number {
  const { totalShiftsOffered, totalShiftsAccepted, totalShiftsCompleted, totalNoShows } = params;
  const completionRate = totalShiftsCompleted / Math.max(totalShiftsAccepted, 1);
  const noShowRate = totalNoShows / Math.max(totalShiftsOffered, 1);
  const score = (completionRate * 0.6 + (1 - noShowRate) * 0.4) * 100;
  return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
}

@Injectable()
export class WorkersService {
  private readonly logger = new Logger(WorkersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkerDto): Promise<Worker> {
    const existing = await this.prisma.worker.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException(`Worker with phone ${dto.phone} already exists`);

    return this.prisma.worker.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        skills: dto.skills ?? [],
        whatsappOptIn: dto.whatsappOptIn ?? true,
        photoUrl: dto.photoUrl,
      },
    });
  }

  async findAll(filter: WorkerFilterDto = {}): Promise<Worker[]> {
    const { skills, kycStatus, isActive, minReliability, limit = 50, offset = 0 } = filter;

    const workers = await this.prisma.worker.findMany({
      where: {
        ...(kycStatus ? { kycStatus } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(skills?.length ? { skills: { hasSome: skills } } : {}),
      },
      skip: offset,
      take: limit,
      orderBy: { reliabilityScore: 'desc' },
    });

    if (minReliability !== undefined) {
      return workers.filter((w) => w.reliabilityScore >= minReliability);
    }
    return workers;
  }

  async findById(id: string): Promise<Worker> {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: { offers: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!worker) throw new NotFoundException(`Worker ${id} not found`);
    return worker;
  }

  async update(id: string, dto: UpdateWorkerDto): Promise<Worker> {
    await this.findById(id);
    return this.prisma.worker.update({ where: { id }, data: dto });
  }

  /**
   * Recompute and persist the reliability score for a worker based on their offer/check-in history.
   */
  async recomputeReliabilityScore(workerId: string): Promise<Worker> {
    const offers = await this.prisma.shiftOffer.findMany({ where: { workerId } });

    const totalShiftsOffered = offers.length;
    const totalShiftsAccepted = offers.filter((o) =>
      ['ACCEPTED'].includes(o.status),
    ).length;
    const totalNoShows = offers.filter((o) => o.status === 'NO_SHOW').length;

    const completedCheckIns = await this.prisma.checkIn.count({
      where: { workerId, isVerified: true },
    });

    const reliabilityScore = computeReliabilityScore({
      totalShiftsOffered,
      totalShiftsAccepted,
      totalShiftsCompleted: completedCheckIns,
      totalNoShows,
    });

    const updated = await this.prisma.worker.update({
      where: { id: workerId },
      data: {
        reliabilityScore,
        totalShiftsOffered,
        totalShiftsAccepted,
        totalShiftsCompleted: completedCheckIns,
        totalNoShows,
      },
    });

    this.logger.log(`Worker ${workerId} reliability updated: ${reliabilityScore}`);
    return updated;
  }

  /**
   * Bulk recompute all workers – intended for cron usage.
   */
  async recomputeAllScores(): Promise<void> {
    const workers = await this.prisma.worker.findMany({ select: { id: true } });
    for (const w of workers) {
      await this.recomputeReliabilityScore(w.id).catch((err) =>
        this.logger.error(`Failed to recompute score for worker ${w.id}: ${err.message}`),
      );
    }
    this.logger.log(`Recomputed scores for ${workers.length} workers`);
  }

  async getBenchWorkers(skills: SkillTag[], minScore = 70, limit = 50): Promise<Worker[]> {
    return this.prisma.worker.findMany({
      where: {
        isActive: true,
        kycStatus: 'APPROVED',
        reliabilityScore: { gte: minScore },
        skills: { hasSome: skills },
      },
      orderBy: { reliabilityScore: 'desc' },
      take: limit,
    });
  }
}
