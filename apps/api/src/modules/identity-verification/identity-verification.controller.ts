import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IdentityVerificationService } from './identity-verification.service';
import { VerifyIdentityDto } from './dto/verify-identity.dto';

@ApiTags('identity')
@ApiBearerAuth()
@Controller('api/v1/identity')
export class IdentityVerificationController {
  constructor(
    private readonly identityService: IdentityVerificationService,
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'NVI üzerinden TC Kimlik No + doğum yılı doğrulaması' })
  async verifyIdentity(@Body() dto: VerifyIdentityDto) {
    const result = await this.identityService.verifyByTcknAndBirthYear(
      dto.tckn,
      dto.birthYear,
      dto.firstName,
      dto.lastName,
    );
    return { status: 'success', data: result };
  }
}
