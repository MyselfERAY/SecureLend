import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

function buildCorsOrigins(): (string | RegExp)[] {
  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  const origins: (string | RegExp)[] = [
    webUrl,
    'https://kiraguvence.com',
    'https://www.kiraguvence.com',
  ];
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:8081', /^http:\/\/192\.168\.\d+\.\d+:\d+$/);
  }
  return origins;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security headers
  app.use(helmet());

  // CORS — restricted to known origins
  const corsOrigins = buildCorsOrigins();
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  logger.log(`CORS origins: ${corsOrigins.map(o => o.toString()).join(', ')}`);

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('SecureLend API')
    .setDescription(
      'Kiracı-Ev Sahibi-Banka Dijital Kira Platformu API Dokümantasyonu\n\n' +
      '## Modüller\n' +
      '- **Auth**: Kayıt, OTP doğrulama, giriş/çıkış\n' +
      '- **User**: Kullanıcı profili, rol yönetimi\n' +
      '- **Property**: Mülk ekleme/düzenleme/silme\n' +
      '- **Contract**: Sözleşme oluşturma, imzalama, fesih\n' +
      '- **Payment**: Kira ödemeleri\n' +
      '- **Bank**: KMH hesapları, ödeme talimatları, transferler\n' +
      '- **Admin**: Platform yönetim paneli (sadece admin)\n' +
      '- **Health**: Sistem sağlık kontrolü'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT Access Token girin',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Kimlik doğrulama işlemleri')
    .addTag('User', 'Kullanıcı yönetimi')
    .addTag('Property', 'Mülk yönetimi')
    .addTag('Contract', 'Sözleşme yönetimi')
    .addTag('Payment', 'Ödeme işlemleri')
    .addTag('Bank', 'Banka ve KMH işlemleri')
    .addTag('Health', 'Sistem sağlık kontrolü')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SecureLend API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { background-color: #1e3a5f; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter (JSend format)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor (masks TCKN, phone, OTP)
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`SecureLend API running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
