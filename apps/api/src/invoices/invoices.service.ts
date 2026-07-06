import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Invoice, InvoiceStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

export class GenerateInvoiceDto {
  requestId: string;
  hourlyRate: number;
  gstRate?: number;
  dueInDays?: number;
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private invoiceCounter = 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.invoiceCounter += 1;
    return `INV-${year}${month}-${String(this.invoiceCounter).padStart(4, '0')}`;
  }

  /**
   * Generate an invoice from all verified check-ins for a request.
   * Also computes booked vs billed headcount/hours delta.
   */
  async generate(dto: GenerateInvoiceDto): Promise<Invoice> {
    const request = await this.prisma.request.findUnique({
      where: { id: dto.requestId },
      include: { company: true, site: true },
    });
    if (!request) throw new NotFoundException(`Request ${dto.requestId} not found`);

    const checkIns = await this.prisma.checkIn.findMany({
      where: { requestId: dto.requestId, isVerified: true, checkOutAt: { not: null } },
      include: { worker: true },
    });

    if (checkIns.length === 0) {
      throw new BadRequestException('No verified check-ins found for this request');
    }

    const gstRate = dto.gstRate ?? Number(process.env.DEFAULT_GST_RATE ?? 0.18);
    const hourlyRate = dto.hourlyRate;
    const dueInDays = dto.dueInDays ?? Number(process.env.INVOICE_DUE_DAYS ?? 30);

    const billedHours = checkIns.reduce((sum, c) => sum + (c.hoursWorked ?? 0), 0);
    const billedHeadcount = checkIns.length;

    // Compute booked hours: headcount * shift duration in hours
    const [startH, startM] = request.shiftStart.split(':').map(Number);
    const [endH, endM] = request.shiftEnd.split(':').map(Number);
    const shiftDurationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
    const bookedHours = request.headcount * shiftDurationHours;
    const bookedHeadcount = request.headcount;

    const subtotal = billedHours * hourlyRate;
    const gstAmount = subtotal * gstRate;
    const total = subtotal + gstAmount;

    const issuedAt = new Date();
    const dueAt = new Date(issuedAt.getTime() + dueInDays * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.invoice.create({
      data: {
        companyId: request.companyId,
        requestId: dto.requestId,
        invoiceNumber: this.generateInvoiceNumber(),
        status: 'ISSUED',
        issuedAt,
        dueAt,
        subtotal: Math.round(subtotal * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        gstRate,
        hourlyRate,
        bookedHeadcount,
        billedHeadcount,
        bookedHours: Math.round(bookedHours * 100) / 100,
        billedHours: Math.round(billedHours * 100) / 100,
        lineItems: {
          create: checkIns.map((c) => ({
            checkInId: c.id,
            workerName: c.worker.name,
            skillTag: c.worker.skills[0] ?? 'GENERAL_HELPER',
            hours: c.hoursWorked ?? 0,
            hourlyRate,
            amount: Math.round((c.hoursWorked ?? 0) * hourlyRate * 100) / 100,
            date: c.checkInAt,
          })),
        },
      },
      include: { lineItems: true, company: true, request: { include: { site: true } } },
    });

    this.logger.log(
      `Invoice ${invoice.invoiceNumber} generated: ₹${invoice.total} (booked ${bookedHeadcount} workers / billed ${billedHeadcount})`,
    );

    // Attempt to create Razorpay payment link
    try {
      const link = await this.notifications.createRazorpayPaymentLink({
        amount: Math.round(total * 100),
        description: `Invoice ${invoice.invoiceNumber} — ${request.title}`,
        customerEmail: (request.company as any).user?.email,
        referenceId: invoice.id,
      });
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          razorpayPaymentLinkId: link.id,
          razorpayPaymentLinkUrl: link.short_url,
        },
      });
    } catch (err) {
      this.logger.error(`Razorpay link creation failed: ${err.message}`);
    }

    return invoice;
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: { include: { checkIn: { include: { worker: true } } } }, company: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async findByCompany(companyId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { companyId },
      include: { lineItems: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async markPaid(id: string): Promise<Invoice> {
    await this.findById(id);
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }

  async markOverdue(): Promise<number> {
    const result = await this.prisma.invoice.updateMany({
      where: {
        status: 'ISSUED',
        dueAt: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    });
    return result.count;
  }
}
