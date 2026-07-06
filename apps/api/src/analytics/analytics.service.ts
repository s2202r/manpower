import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FillRateSummary {
  requestId: string;
  title: string;
  date: Date;
  siteId: string;
  headcount: number;
  confirmedCount: number;
  checkedInCount: number;
  fillRate: number;
  status: string;
}

export interface OpsConsoleSummary {
  date: string;
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  totalWorkerOffered: number;
  totalWorkerAccepted: number;
  totalCheckedIn: number;
  avgFillRate: number;
  atRiskRequests: number;
}

export interface WorkerAnalytics {
  totalWorkers: number;
  approvedWorkers: number;
  activeWorkers: number;
  avgReliabilityScore: number;
  topWorkers: { id: string; name: string; reliabilityScore: number }[];
  skillDistribution: Record<string, number>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFillRates(fromDate?: Date, toDate?: Date): Promise<FillRateSummary[]> {
    const from = fromDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = toDate ?? new Date();

    const requests = await this.prisma.request.findMany({
      where: { date: { gte: from, lte: to } },
      include: {
        offers: true,
        checkIns: true,
      },
      orderBy: { date: 'desc' },
    });

    return requests.map((r) => {
      const confirmedCount = r.offers.filter((o) => o.status === 'ACCEPTED').length;
      const checkedInCount = r.checkIns.length;
      const fillRate =
        r.headcount > 0 ? Math.round((checkedInCount / r.headcount) * 1000) / 10 : 0;

      return {
        requestId: r.id,
        title: r.title,
        date: r.date,
        siteId: r.siteId,
        headcount: r.headcount,
        confirmedCount,
        checkedInCount,
        fillRate,
        status: r.status,
      };
    });
  }

  async getOpsConsole(dateStr?: string): Promise<OpsConsoleSummary> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [requests, offers, checkIns] = await Promise.all([
      this.prisma.request.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        include: { offers: true, checkIns: true },
      }),
      this.prisma.shiftOffer.findMany({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      this.prisma.checkIn.findMany({
        where: { checkInAt: { gte: startOfDay, lte: endOfDay } },
      }),
    ]);

    const statusCounts = {
      OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0,
    };
    let totalFillRate = 0;
    let atRiskCount = 0;

    for (const r of requests) {
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
      const checkedIn = r.checkIns.length;
      const fillRate = r.headcount > 0 ? checkedIn / r.headcount : 0;
      totalFillRate += fillRate;

      // Check AT_RISK
      const confirmed = r.offers.filter((o) => o.status === 'ACCEPTED').length;
      const shiftDate = new Date(r.date);
      const [sh, sm] = r.shiftStart.split(':').map(Number);
      shiftDate.setHours(sh, sm, 0, 0);
      const hoursToShift = (shiftDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (confirmed < r.guaranteedHeadcount && hoursToShift > 0) {
        atRiskCount++;
      }
    }

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalRequests: requests.length,
      openRequests: statusCounts.OPEN,
      inProgressRequests: statusCounts.IN_PROGRESS,
      completedRequests: statusCounts.COMPLETED,
      cancelledRequests: statusCounts.CANCELLED,
      totalWorkerOffered: offers.length,
      totalWorkerAccepted: offers.filter((o) => o.status === 'ACCEPTED').length,
      totalCheckedIn: checkIns.length,
      avgFillRate:
        requests.length > 0
          ? Math.round((totalFillRate / requests.length) * 1000) / 10
          : 0,
      atRiskRequests: atRiskCount,
    };
  }

  async getWorkerAnalytics(): Promise<WorkerAnalytics> {
    const workers = await this.prisma.worker.findMany({
      select: {
        id: true,
        name: true,
        kycStatus: true,
        isActive: true,
        reliabilityScore: true,
        skills: true,
      },
    });

    const approved = workers.filter((w) => w.kycStatus === 'APPROVED');
    const active = workers.filter((w) => w.isActive);
    const avgScore =
      workers.length > 0
        ? workers.reduce((s, w) => s + w.reliabilityScore, 0) / workers.length
        : 0;

    const topWorkers = [...workers]
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, 10)
      .map(({ id, name, reliabilityScore }) => ({ id, name, reliabilityScore }));

    const skillDistribution: Record<string, number> = {};
    for (const w of workers) {
      for (const skill of w.skills) {
        skillDistribution[skill] = (skillDistribution[skill] ?? 0) + 1;
      }
    }

    return {
      totalWorkers: workers.length,
      approvedWorkers: approved.length,
      activeWorkers: active.length,
      avgReliabilityScore: Math.round(avgScore * 10) / 10,
      topWorkers,
      skillDistribution,
    };
  }

  async getRevenueAnalytics(fromDate?: Date, toDate?: Date) {
    const from = fromDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = toDate ?? new Date();

    const invoices = await this.prisma.invoice.findMany({
      where: { issuedAt: { gte: from, lte: to } },
    });

    const total = invoices.reduce((s, i) => s + i.total, 0);
    const paid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
    const outstanding = invoices
      .filter((i) => i.status === 'ISSUED' || i.status === 'OVERDUE')
      .reduce((s, i) => s + i.total, 0);

    const bookedHours = invoices.reduce((s, i) => s + i.bookedHours, 0);
    const billedHours = invoices.reduce((s, i) => s + i.billedHours, 0);
    const utilizationRate =
      bookedHours > 0 ? Math.round((billedHours / bookedHours) * 1000) / 10 : 0;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalRevenue: Math.round(total * 100) / 100,
      paidRevenue: Math.round(paid * 100) / 100,
      outstandingRevenue: Math.round(outstanding * 100) / 100,
      invoiceCount: invoices.length,
      bookedHours: Math.round(bookedHours * 100) / 100,
      billedHours: Math.round(billedHours * 100) / 100,
      utilizationRate,
    };
  }
}
