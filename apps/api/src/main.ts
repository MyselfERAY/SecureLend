// redeploy: güvenlik sertleştirme (3. tur) — Railway build retry
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

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

  // Behind Railway's reverse proxy — trust the first proxy hop so req.ip
  // resolves to the real client IP (correct rate-limiting & audit logging)
  app.set('trust proxy', 1);

  // Content-Length guard: gövde PARSE EDİLMEDEN önce çalışır. Yalnızca foto/KYC
  // upload route'ları büyük gövdeye izin verir; diğer (ucuz) endpoint'lere 2MB
  // üstü gövde 413 ile reddedilir → 10MB body spam'iyle memory/CPU tüketimi engellenir.
  const MAX_DEFAULT_BODY = 2 * 1024 * 1024; // 2MB
  app.use((req: Request, res: Response, next: NextFunction) => {
    const len = Number(req.headers['content-length'] || 0);
    const p = req.path || '';
    const isUpload =
      p.includes('/upload') || p.includes('/kyc') || p.includes('/document');
    if (!isUpload && len > MAX_DEFAULT_BODY) {
      res.status(413).json({
        status: 'error',
        message: 'Istek govdesi cok buyuk.',
        code: 413,
      });
      return;
    }
    next();
  });

  // Increase JSON body limit for base64 photo uploads (default 100KB is too small)
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true } as any);

  // Security headers & cookie parser
  app.use(helmet());
  // Helmet doesn't set Permissions-Policy by default — lock down powerful features
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
    );
    next();
  });
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

  // Global exception filter & logging interceptor registered via DI in AppModule
  // (APP_FILTER + APP_INTERCEPTOR) — enables AnalyticsService injection

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`SecureLend API running on port ${port}`);
}

bootstrap();
