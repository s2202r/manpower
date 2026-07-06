import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Company, User } from '@prisma/client';

export class CreateCompanyDto {
  name: string;
  gstNumber?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

export class UpdateCompanyDto {
  name?: string;
  gstNumber?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User, dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (existing) {
      throw new ForbiddenException('User already has a company');
    }
    return this.prisma.company.create({
      data: { userId: user.id, ...dto },
    });
  }

  async findMyCompany(user: User): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { userId: user.id },
      include: { sites: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findById(id: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { sites: true },
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async update(user: User, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) throw new NotFoundException('Company not found');
    return this.prisma.company.update({ where: { id: company.id }, data: dto });
  }

  async findAll(): Promise<Company[]> {
    return this.prisma.company.findMany({ include: { sites: true } });
  }
}
