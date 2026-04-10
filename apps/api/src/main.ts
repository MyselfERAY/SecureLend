import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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
    origins.push('http://localhost:3000', 'http://localhost:8081');
  }
  return origins;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Increase JSON body limit for base64 photo uploads (default 100KB is too small)
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true } as any);

  // Security headers & cookie parser
  app.use(helmet());
  app.use(cookieParser());

  // CORS — restricted to known origins
  const corsOrigins = buildCorsOrigins();
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  logger.log(`CORS origins: ${corsOrigins.map(o => o.toString()).join(', ')}`);

  // Swagger API Documentation — only in non-production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SecureLend API')
      .setDescription('SecureLend API Documentation (dev only)')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'SecureLend API Docs',
      swaggerOptions: { persistAuthorization: true, docExpansion: 'list' },
    });
  }

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
}

bootstrap();
