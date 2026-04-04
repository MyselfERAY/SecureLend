import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PushNotificationService } from './push-notification.service';

class SavePushTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('api/v1/users')
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save Expo push notification token' })
  async savePushToken(
    @CurrentUser('id') userId: string,
    @Body() dto: SavePushTokenDto,
  ) {
    await this.pushNotificationService.savePushToken(userId, dto.token);
    return { status: 'success', data: { message: 'Push token kaydedildi' } };
  }
}
