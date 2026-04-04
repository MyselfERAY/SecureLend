import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { Request } from 'express';
import type { JSendSuccess } from '@securelend/shared';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ short: { limit: 1, ttl: seconds(5) } })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<JSendSuccess<{ userId: string; maskedTckn: string; phone: string }>> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const result = await this.authService.register(
      dto.tckn,
      dto.phone,
      dto.fullName,
      dto.dateOfBirth,
      ipAddress,
    );
    return { status: 'success', data: result };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 1, ttl: seconds(5) } })
  async login(
    @Body() dto: LoginDto,
  ): Promise<JSendSuccess<{ userId: string; phone: string }>> {
    const result = await this.authService.login(dto.tckn, dto.phone);
    return { status: 'success', data: result };
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: seconds(10) } })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
  ): Promise<JSendSuccess<AuthTokens>> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const tokens = await this.authService.verifyOtp(
      dto.phone,
      dto.code,
      ipAddress,
      userAgent,
    );
    return { status: 'success', data: tokens };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: seconds(10) } })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<JSendSuccess<AuthTokens>> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const tokens = await this.authService.refreshTokens(
      dto.refreshToken,
      ipAddress,
      userAgent,
    );
    return { status: 'success', data: tokens };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() dto: RefreshTokenDto,
  ): Promise<JSendSuccess<{ message: string }>> {
    await this.authService.logout(dto.refreshToken);
    return { status: 'success', data: { message: 'Cikis yapildi' } };
  }
}
