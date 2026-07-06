import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('fill-rates')
  getFillRates(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getFillRates(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('ops-console')
  getOpsConsole(@Query('date') date?: string) {
    return this.analyticsService.getOpsConsole(date);
  }

  @Get('workers')
  getWorkerAnalytics() {
    return this.analyticsService.getWorkerAnalytics();
  }

  @Get('revenue')
  getRevenue(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getRevenueAnalytics(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
