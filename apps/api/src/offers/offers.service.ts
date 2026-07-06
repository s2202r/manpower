import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftOffer, OfferStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

export class CreateOfferDto {
  requestId: string;
  workerIds: string[];
}

export class RespondOfferDto {
  status: 'ACCEPTED' | 'DECLINED';
}

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createBulk(dto: CreateOfferDto): Promise<ShiftOffer[]> {
    const request = await this.prisma.request.findUnique({
      where: { id: dto.requestId },
      include: { site: true },
    });
    if (!request) throw new NotFoundException(`Request ${dto.requestId} not found`);

    const created: ShiftOffer[] = [];

    for (const workerId of dto.workerIds) {
      const worker = await this.prisma.worker.findUnique({ where: { id: workerId } });
      if (!worker) {
        this.logger.warn(`Worker ${workerId} not found, skipping`);
        continue;
      }

      const existing = await this.prisma.shiftOffer.findUnique({
        where: { requestId_workerId: { requestId: dto.requestId, workerId } },
      });
      if (existing) {
        this.logger.warn(`Offer already exists for worker ${workerId} on request ${dto.requestId}`);
        continue;
      }

      const offer = await this.prisma.shiftOffer.create({
        data: { requestId: dto.requestId, workerId, status: 'PENDING' },
        include: { worker: true, request: { include: { site: true } } },
      });
      created.push(offer);

      // Send WhatsApp notification
      if (worker.whatsappOptIn) {
        await this.notifications.sendShiftOffer(offer as any).catch((err) =>
          this.logger.error(`WhatsApp notify failed for worker ${workerId}: ${err.message}`),
        );
      }
    }

    return created;
  }

  async respond(offerId: string, workerId: string, dto: RespondOfferDto): Promise<ShiftOffer> {
    const offer = await this.prisma.shiftOffer.findFirst({
      where: { id: offerId, workerId },
    });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.status !== 'PENDING') {
      throw new BadRequestException(`Offer is already in status ${offer.status}`);
    }

    return this.prisma.shiftOffer.update({
      where: { id: offerId },
      data: { status: dto.status, respondedAt: new Date() },
    });
  }

  async findByRequest(requestId: string): Promise<ShiftOffer[]> {
    return this.prisma.shiftOffer.findMany({
      where: { requestId },
      include: { worker: true },
      orderBy: { offeredAt: 'desc' },
    });
  }

  async findByWorker(workerId: string): Promise<ShiftOffer[]> {
    return this.prisma.shiftOffer.findMany({
      where: { workerId },
      include: { request: { include: { site: true } } },
      orderBy: { offeredAt: 'desc' },
    });
  }

  async markNoShow(offerId: string): Promise<ShiftOffer> {
    const offer = await this.prisma.shiftOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);

    const updated = await this.prisma.shiftOffer.update({
      where: { id: offerId },
      data: { status: 'NO_SHOW' },
    });

    // Update worker no-show count
    await this.prisma.worker.update({
      where: { id: offer.workerId },
      data: { totalNoShows: { increment: 1 } },
    });

    return updated;
  }

  async expireStaleOffers(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    const result = await this.prisma.shiftOffer.updateMany({
      where: { status: 'PENDING', offeredAt: { lt: cutoff } },
      data: { status: 'EXPIRED' },
    });
    this.logger.log(`Expired ${result.count} stale offers`);
    return result.count;
  }
}
