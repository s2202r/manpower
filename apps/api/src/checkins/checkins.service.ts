import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckIn } from '@prisma/client';

export class CheckInDto {
  workerId: string;
  requestId: string;
  lat: number;
  lng: number;
  selfieUrl?: string;
}

export class CheckOutDto {
  lat: number;
  lng: number;
}

/**
 * Haversine formula — returns distance in metres between two (lat, lng) points.
 */
export function haversineDistanceMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class CheckInsService {
  private readonly logger = new Logger(CheckInsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkIn(dto: CheckInDto): Promise<CheckIn> {
    const request = await this.prisma.request.findUnique({
      where: { id: dto.requestId },
      include: { site: true },
    });
    if (!request) throw new NotFoundException(`Request ${dto.requestId} not found`);

    const site = (request as any).site;

    // Geofence validation
    const distance = haversineDistanceMetres(dto.lat, dto.lng, site.lat, site.lng);
    if (distance > site.radiusMeters) {
      throw new BadRequestException(
        `Check-in location is ${Math.round(distance)}m from site; allowed radius is ${site.radiusMeters}m`,
      );
    }

    // Check for existing open check-in
    const existing = await this.prisma.checkIn.findFirst({
      where: { workerId: dto.workerId, requestId: dto.requestId, checkOutAt: null },
    });
    if (existing) {
      throw new BadRequestException('Worker already has an open check-in for this request');
    }

    // Compute punctuality: difference between actual check-in and scheduled shift start
    const shiftDate = new Date(request.date);
    const [shiftHour, shiftMin] = request.shiftStart.split(':').map(Number);
    shiftDate.setHours(shiftHour, shiftMin, 0, 0);
    const now = new Date();
    const punctualityMins = Math.round((now.getTime() - shiftDate.getTime()) / 60000);

    const checkIn = await this.prisma.checkIn.create({
      data: {
        workerId: dto.workerId,
        requestId: dto.requestId,
        siteId: site.id,
        checkInAt: now,
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        checkInSelfieUrl: dto.selfieUrl,
        punctualityMins,
      },
      include: { worker: true, site: true },
    });

    this.logger.log(
      `Worker ${dto.workerId} checked in for request ${dto.requestId} at distance ${Math.round(distance)}m, punctuality: ${punctualityMins}min`,
    );

    return checkIn;
  }

  async checkOut(checkInId: string, dto: CheckOutDto): Promise<CheckIn> {
    const checkIn = await this.prisma.checkIn.findUnique({ where: { id: checkInId } });
    if (!checkIn) throw new NotFoundException(`CheckIn ${checkInId} not found`);
    if (checkIn.checkOutAt) throw new BadRequestException('Already checked out');

    const request = await this.prisma.request.findUnique({
      where: { id: checkIn.requestId },
      include: { site: true },
    });
    const site = (request as any).site;

    // Geofence check at checkout too
    const distance = haversineDistanceMetres(dto.lat, dto.lng, site.lat, site.lng);
    if (distance > site.radiusMeters * 1.5) {
      // Allow 50% tolerance at checkout
      throw new BadRequestException(
        `Check-out location is ${Math.round(distance)}m from site; allowed radius is ${site.radiusMeters * 1.5}m`,
      );
    }

    const checkOutAt = new Date();
    const hoursWorked =
      (checkOutAt.getTime() - checkIn.checkInAt.getTime()) / (1000 * 60 * 60);

    return this.prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        checkOutAt,
        checkOutLat: dto.lat,
        checkOutLng: dto.lng,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        isVerified: true,
      },
    });
  }

  async findByRequest(requestId: string): Promise<CheckIn[]> {
    return this.prisma.checkIn.findMany({
      where: { requestId },
      include: { worker: true },
      orderBy: { checkInAt: 'desc' },
    });
  }

  async findByWorker(workerId: string, limit = 20): Promise<CheckIn[]> {
    return this.prisma.checkIn.findMany({
      where: { workerId },
      include: { request: { include: { site: true } } },
      orderBy: { checkInAt: 'desc' },
      take: limit,
    });
  }

  async findById(id: string): Promise<CheckIn> {
    const c = await this.prisma.checkIn.findUnique({
      where: { id },
      include: { worker: true, request: true, site: true },
    });
    if (!c) throw new NotFoundException(`CheckIn ${id} not found`);
    return c;
  }

  async verifyCheckIn(id: string): Promise<CheckIn> {
    await this.findById(id);
    return this.prisma.checkIn.update({ where: { id }, data: { isVerified: true } });
  }
}
