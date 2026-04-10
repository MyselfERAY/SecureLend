import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { Request, Response } from 'express';
import type { JSendSuccess } from '@securelend/shared';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

const RT_COOKIE = '__rt';
const RT_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

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
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const result = await this.authService.register(
      dto.tckn,
      dto.phone,
      dto.fullName,
      dto.dateOfBirth,
      ipAddress,
      dto.consents,
      userAgent,
    );
    return { status: 'success', data: result };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 1, ttl: seconds(5) } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<JSendSuccess<{ userId: string; phone: string }>> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const result = await this.authService.login(dto.tckn, dto.phone, ipAddress);
    return { status: 'success', data: result };
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: seconds(60) } })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const tokens = await this.authService.verifyOtp(dto.phone, dto.code, ipAddress, userAgent);
    res.cookie(RT_COOKIE, tokens.refreshToken, RT_COOKIE_OPTS);
    return { status: 'success', data: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: seconds(10) } })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[RT_COOKIE] || dto.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Refresh token bulunamadi');
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const tokens = await this.authService.refreshTokens(refreshToken, ipAddress, userAgent);
    res.cookie(RT_COOKIE, tokens.refreshToken, RT_COOKIE_OPTS);
    return { status: 'success', data: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[RT_COOKIE] || dto.refreshToken;
    if (refreshToken) await this.authService.logout(refreshToken);
    res.clearCookie(RT_COOKIE, { path: '/' });
    return { status: 'success', data: { message: 'Cikis yapildi' } };
  }
}
