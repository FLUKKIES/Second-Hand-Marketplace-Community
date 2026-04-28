import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { SocialModule } from './social/social.module';
import { ReportsModule } from './reports/reports.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '.', 'public'),
      serveRoot: '/',
      serveStaticOptions: {
        index: false,
      },
    }),
    UsersModule,
    CommonModule,
    MarketplaceModule,
    SocialModule,
    ReportsModule,
    AdminModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
