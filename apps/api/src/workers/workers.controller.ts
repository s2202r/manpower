import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkersService, CreateWorkerDto, UpdateWorkerDto, WorkerFilterDto } from './workers.service';
import { SkillTag } from '@prisma/client';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  create(@Body() dto: CreateWorkerDto) {
    return this.workersService.create(dto);
  }

  @Get()
  findAll(@Query() query: WorkerFilterDto) {
    return this.workersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workersService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    return this.workersService.update(id, dto);
  }

  @Post(':id/recompute-score')
  @HttpCode(HttpStatus.OK)
  recomputeScore(@Param('id') id: string) {
    return this.workersService.recomputeReliabilityScore(id);
  }

  @Post('recompute-all-scores')
  @HttpCode(HttpStatus.OK)
  recomputeAll() {
    return this.workersService.recomputeAllScores();
  }

  @Get('bench/available')
  getBench(
    @Query('skills') skills: string,
    @Query('minScore') minScore: string,
    @Query('limit') limit: string,
  ) {
    const skillList = skills
      ? skills.split(',').filter((s) => Object.values(SkillTag).includes(s as SkillTag)) as SkillTag[]
      : Object.values(SkillTag);
    return this.workersService.getBenchWorkers(
      skillList,
      minScore ? Number(minScore) : 70,
      limit ? Number(limit) : 50,
    );
  }
}
