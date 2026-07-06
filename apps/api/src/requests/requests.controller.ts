import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RequestsService, CreateRequestDto, UpdateRequestDto } from './requests.service';
import { RequestStatus } from '@prisma/client';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(req.user, dto);
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: RequestStatus) {
    return this.requestsService.findByCompany(req.user);
  }

  @Get('admin/all')
  findAllAdmin(@Query('status') status?: RequestStatus) {
    return this.requestsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findById(id);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateRequestDto) {
    return this.requestsService.update(req.user, id, dto);
  }

  @Get(':id/overbooking-suggestion')
  overbookingSuggestion(@Param('id') id: string) {
    return this.requestsService.getOverbookingSuggestion(id);
  }

  @Get(':id/fill-risk')
  fillRisk(@Param('id') id: string) {
    return this.requestsService.getFillRiskAlert(id);
  }
}
