import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OffersService, CreateOfferDto, RespondOfferDto } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  createBulk(@Body() dto: CreateOfferDto) {
    return this.offersService.createBulk(dto);
  }

  @Put(':id/respond')
  respond(@Param('id') id: string, @Request() req, @Body() dto: RespondOfferDto) {
    // In a real app, workerId would come from the authenticated worker user
    const workerId = req.user?.worker?.id ?? req.body?.workerId;
    return this.offersService.respond(id, workerId, dto);
  }

  @Get('request/:requestId')
  findByRequest(@Param('requestId') requestId: string) {
    return this.offersService.findByRequest(requestId);
  }

  @Get('worker/:workerId')
  findByWorker(@Param('workerId') workerId: string) {
    return this.offersService.findByWorker(workerId);
  }

  @Put(':id/no-show')
  markNoShow(@Param('id') id: string) {
    return this.offersService.markNoShow(id);
  }

  @Post('expire-stale')
  @HttpCode(HttpStatus.OK)
  expireStale() {
    return this.offersService.expireStaleOffers();
  }
}
