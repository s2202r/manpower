import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { InvoicesService, GenerateInvoiceDto } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('generate')
  generate(@Body() dto: GenerateInvoiceDto) {
    return this.invoicesService.generate(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Get('company/:companyId')
  findByCompany(@Param('companyId') companyId: string) {
    return this.invoicesService.findByCompany(companyId);
  }

  @Put(':id/paid')
  markPaid(@Param('id') id: string) {
    return this.invoicesService.markPaid(id);
  }

  @Post('mark-overdue')
  markOverdue() {
    return this.invoicesService.markOverdue();
  }
}
