import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CheckInsService, CheckInDto, CheckOutDto } from './checkins.service';

@Controller('checkins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  checkIn(@Body() dto: CheckInDto) {
    return this.checkInsService.checkIn(dto);
  }

  @Put(':id/checkout')
  checkOut(@Param('id') id: string, @Body() dto: CheckOutDto) {
    return this.checkInsService.checkOut(id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkInsService.findById(id);
  }

  @Put(':id/verify')
  verify(@Param('id') id: string) {
    return this.checkInsService.verifyCheckIn(id);
  }

  @Get('by-request/:requestId')
  findByRequest(@Param('requestId') requestId: string) {
    return this.checkInsService.findByRequest(requestId);
  }

  @Get('by-worker/:workerId')
  findByWorker(@Param('workerId') workerId: string, @Query('limit') limit: string) {
    return this.checkInsService.findByWorker(workerId, limit ? Number(limit) : 20);
  }
}
