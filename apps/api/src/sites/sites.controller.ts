import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SitesService, CreateSiteDto, UpdateSiteDto } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateSiteDto) {
    return this.sitesService.create(req.user, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.sitesService.findByCompany(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sitesService.findById(id);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.sitesService.update(req.user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Request() req, @Param('id') id: string) {
    return this.sitesService.delete(req.user, id);
  }
}
