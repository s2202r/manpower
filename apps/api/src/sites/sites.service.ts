import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Site, User } from '@prisma/client';

export class CreateSiteDto {
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
}

export class UpdateSiteDto {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
}

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User, dto: CreateSiteDto): Promise<Site> {
    const company = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) throw new ForbiddenException('User has no company');
    return this.prisma.site.create({ data: { companyId: company.id, ...dto } });
  }

  async findByCompany(user: User): Promise<Site[]> {
    const company = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) throw new NotFoundException('Company not found');
    return this.prisma.site.findMany({ where: { companyId: company.id } });
  }

  async findById(id: string): Promise<Site> {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException(`Site ${id} not found`);
    return site;
  }

  async update(user: User, siteId: string, dto: UpdateSiteDto): Promise<Site> {
    const company = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) throw new ForbiddenException('User has no company');
    const site = await this.prisma.site.findFirst({ where: { id: siteId, companyId: company.id } });
    if (!site) throw new NotFoundException(`Site ${siteId} not found or access denied`);
    return this.prisma.site.update({ where: { id: siteId }, data: dto });
  }

  async delete(user: User, siteId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) throw new ForbiddenException('User has no company');
    const site = await this.prisma.site.findFirst({ where: { id: siteId, companyId: company.id } });
    if (!site) throw new NotFoundException(`Site ${siteId} not found or access denied`);
    await this.prisma.site.delete({ where: { id: siteId } });
  }
}
