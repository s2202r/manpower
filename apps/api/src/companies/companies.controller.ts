import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { CompaniesService, CreateCompanyDto, UpdateCompanyDto } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(req.user, dto);
  }

  @Get('me')
  getMyCompany(@Request() req) {
    return this.companiesService.findMyCompany(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Put('me')
  update(@Request() req, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(req.user, dto);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }
}
