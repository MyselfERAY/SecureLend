import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard, seconds, minutes } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './modules/prisma/prisma.module';
import { EncryptionModule } from './modules/encryption/encryption.module';
import { ApplicationModule } from './modules/application/application.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PropertyModule } from './modules/property/property.module';
import { ContractModule } from './modules/contract/contract.module';
import { PaymentModule } from './modules/payment/payment.module';
import { BankModule } from './modules/bank/bank.module';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Mobil web uygulamasını statik dosya olarak sun
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'mobile', 'dist'),
      serveRoot: '/app',
      serveStaticOptions: {
        index: ['index.html'],
        fallthrough: true,
      },
    }),
    // DEV: Rate limit gevsetildi
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: seconds(1),
        limit: 100,
      },
      {
        name: 'medium',
        ttl: seconds(10),
        limit: 500,
      },
      {
        name: 'long',
        ttl: minutes(1),
        limit: 3000,
      },
    ]),
    PrismaModule,
    EncryptionModule,
    NotificationModule,
    AuthModule,
    UserModule,
    ApplicationModule,
    PropertyModule,
    ContractModule,
    PaymentModule,
    BankModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    // DEV: ThrottlerGuard devre disi birakildi
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
