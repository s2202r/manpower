import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { SitesModule } from './sites/sites.module';
import { WorkersModule } from './workers/workers.module';
import { RequestsModule } from './requests/requests.module';
import { OffersModule } from './offers/offers.module';
import { CheckInsModule } from './checkins/checkins.module';
import { InvoicesModule } from './invoices/invoices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    SitesModule,
    WorkersModule,
    RequestsModule,
    OffersModule,
    CheckInsModule,
    InvoicesModule,
    NotificationsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
