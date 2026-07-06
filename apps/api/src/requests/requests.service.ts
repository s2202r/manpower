import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request as ShiftRequest, RequestStatus, SkillTag, User } from '@prisma/client';

export class CreateRequestDto {
  siteId: string;
  title: string;
  date: string; // ISO date string
  shiftStart: string; // HH:MM
  shiftEnd: string;   // HH:MM
  headcount: number;
  skillTags?: SkillTag[];
  isRecurring?: boolean;
  recurringDays?: number[];
  notes?: string;
  fillRateThreshold?: number;
  guaranteedHeadcount?: number;
}

export class UpdateRequestDto {
  title?: string;
  date?: string;
  shiftStart?: string;
  shiftEnd?: string;
  headcount?: number;
  skillTags?: SkillTag[];
  status?: RequestStatus;
  notes?: string;
}

export interface OverbookingSuggestion {
  recommendedBuffer: number;
  recommendedTotalOffers: number;
  breakdown: {
    headcount: number;
    avgAcceptRate: number;
    avgShowUpRate: number;
    formula: string;
  };
}

export interface FillRiskAlert {
  status: 'OK' | 'AT_RISK' | 'BREACHED';
  confirmedCount: number;
  guaranteedHeadcount: number;
  headcount: number;
  hoursToShift: number;
}

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getCompanyForUser(userId: string) {
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (!company) throw new ForbiddenException('User has no company');
    return company;
  }

  async create(user: User, dto: CreateRequestDto): Promise<ShiftRequest> {
    const company = await this.getCompanyForUser(user.id);

    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, companyId: company.id },
    });
    if (!site) throw new NotFoundException(`Site ${dto.siteId} not found`);

    const targetHeadcount = dto.headcount;
    const guaranteedHeadcount = dto.guaranteedHeadcount ?? Math.ceil(dto.headcount * 0.8);

    return this.prisma.request.create({
      data: {
        companyId: company.id,
        siteId: dto.siteId,
        title: dto.title,
        date: new Date(dto.date),
        shiftStart: dto.shiftStart,
        shiftEnd: dto.shiftEnd,
        headcount: dto.headcount,
        targetHeadcount,
        guaranteedHeadcount,
        skillTags: dto.skillTags ?? [],
        isRecurring: dto.isRecurring ?? false,
        recurringDays: dto.recurringDays ?? [],
        notes: dto.notes,
        fillRateThreshold: dto.fillRateThreshold ?? 0.95,
      },
    });
  }

  async findByCompany(user: User): Promise<ShiftRequest[]> {
    const company = await this.getCompanyForUser(user.id);
    return this.prisma.request.findMany({
      where: { companyId: company.id },
      include: { site: true, offers: { include: { worker: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: string): Promise<ShiftRequest> {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        site: true,
        company: true,
        offers: { include: { worker: true } },
        checkIns: { include: { worker: true } },
      },
    });
    if (!request) throw new NotFoundException(`Request ${id} not found`);
    return request;
  }

  async update(user: User, id: string, dto: UpdateRequestDto): Promise<ShiftRequest> {
    const company = await this.getCompanyForUser(user.id);
    const request = await this.prisma.request.findFirst({ where: { id, companyId: company.id } });
    if (!request) throw new NotFoundException(`Request ${id} not found or access denied`);

    return this.prisma.request.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(dto.shiftStart ? { shiftStart: dto.shiftStart } : {}),
        ...(dto.shiftEnd ? { shiftEnd: dto.shiftEnd } : {}),
        ...(dto.headcount ? { headcount: dto.headcount, targetHeadcount: dto.headcount } : {}),
        ...(dto.skillTags ? { skillTags: dto.skillTags } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  /**
   * Calculate overbooking buffer suggestion.
   *
   * buffer = ceil(headcount / (acceptRate * showUpRate)) - headcount
   *
   * We compute acceptRate and showUpRate from the bench workers
   * matching the request's skill tags over the past 90 days.
   */
  async getOverbookingSuggestion(requestId: string): Promise<OverbookingSuggestion> {
    const request = await this.findById(requestId);

    // Get historical offer stats for workers with matching skills
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const offers = await this.prisma.shiftOffer.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
        worker: {
          skills: { hasSome: (request as any).skillTags },
        },
      },
      include: { worker: true },
    });

    const total = offers.length;
    if (total === 0) {
      // Fallback assumption: 75% accept rate, 85% show-up rate
      const acceptRate = 0.75;
      const showUpRate = 0.85;
      const buffer = Math.max(
        0,
        Math.ceil((request as any).headcount / (acceptRate * showUpRate)) - (request as any).headcount,
      );
      return {
        recommendedBuffer: buffer,
        recommendedTotalOffers: (request as any).headcount + buffer,
        breakdown: {
          headcount: (request as any).headcount,
          avgAcceptRate: acceptRate,
          avgShowUpRate: showUpRate,
          formula: 'ceil(headcount / (acceptRate * showUpRate)) - headcount [fallback defaults used]',
        },
      };
    }

    const accepted = offers.filter((o) => o.status === 'ACCEPTED').length;
    const acceptRate = accepted / total;

    const noShows = offers.filter((o) => o.status === 'NO_SHOW').length;
    const showUpRate = accepted > 0 ? (accepted - noShows) / accepted : 0.85;

    const headcount = (request as any).headcount;
    const buffer = Math.max(
      0,
      Math.ceil(headcount / (Math.max(acceptRate, 0.1) * Math.max(showUpRate, 0.1))) - headcount,
    );

    return {
      recommendedBuffer: buffer,
      recommendedTotalOffers: headcount + buffer,
      breakdown: {
        headcount,
        avgAcceptRate: Math.round(acceptRate * 1000) / 1000,
        avgShowUpRate: Math.round(showUpRate * 1000) / 1000,
        formula: 'ceil(headcount / (acceptRate * showUpRate)) - headcount',
      },
    };
  }

  /**
   * Check fill risk for a request.
   * AT_RISK: confirmed < guaranteedHeadcount AND >2 hours to shift start
   * BREACHED: confirmed < guaranteedHeadcount AND <=2 hours to shift start
   */
  async getFillRiskAlert(requestId: string): Promise<FillRiskAlert> {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: { offers: true },
    });
    if (!request) throw new NotFoundException(`Request ${requestId} not found`);

    const confirmedCount = request.offers.filter((o) => o.status === 'ACCEPTED').length;

    // Compute hours to shift start
    const shiftDate = new Date(request.date);
    const [shiftHour, shiftMin] = request.shiftStart.split(':').map(Number);
    shiftDate.setHours(shiftHour, shiftMin, 0, 0);
    const hoursToShift = (shiftDate.getTime() - Date.now()) / (1000 * 60 * 60);

    const isUnderGuarantee = confirmedCount < request.guaranteedHeadcount;
    let status: 'OK' | 'AT_RISK' | 'BREACHED' = 'OK';

    if (isUnderGuarantee) {
      status = hoursToShift > 2 ? 'AT_RISK' : 'BREACHED';
      this.logger.warn(
        `Request ${requestId} fill risk: ${status} (${confirmedCount}/${request.guaranteedHeadcount}, ${hoursToShift.toFixed(1)}h to shift)`,
      );
    }

    return {
      status,
      confirmedCount,
      guaranteedHeadcount: request.guaranteedHeadcount,
      headcount: request.headcount,
      hoursToShift: Math.round(hoursToShift * 10) / 10,
    };
  }

  async findAll(status?: RequestStatus): Promise<ShiftRequest[]> {
    return this.prisma.request.findMany({
      where: { ...(status ? { status } : {}) },
      include: { site: true, company: true },
      orderBy: { date: 'asc' },
    });
  }
}
