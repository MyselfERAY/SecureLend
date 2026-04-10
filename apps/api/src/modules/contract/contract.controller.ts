import {
  Controller, Get, Post, Body, Param, Req, Res,
  ParseUUIDPipe, HttpCode, HttpStatus, Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { Request, Response } from 'express';
import type { JSendSuccess } from '@securelend/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ContractService } from './contract.service';
import { ContractPdfService } from './contract-pdf.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ActivateContractDto } from './dto/activate-contract.dto';

@ApiTags('Contract')
@ApiBearerAuth('access-token')
@Controller('api/v1/contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly contractPdfService: ContractPdfService,
  ) {}

  @Post()
  @Roles(UserRole.LANDLORD)
  @Throttle({ short: { limit: 1, ttl: seconds(10) } })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateContractDto,
  ): Promise<JSendSuccess<unknown>> {
    const contract = await this.contractService.create(user.id, dto);
    return { status: 'success', data: contract };
  }

  @Get()
  async getMyContracts(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<unknown>> {
    const contracts = await this.contractService.getMyContracts(user.id);
    return { status: 'success', data: contracts };
  }

  @Get(':id')
  async getById(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JSendSuccess<unknown>> {
    const contract = await this.contractService.getContractDetail(id, user.id);
    return { status: 'success', data: contract };
  }

  @Get(':id/pdf')
  async getPdf(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.contractPdfService.generatePdf(id, user.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="kira-sozlesmesi-${id.slice(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 1, ttl: seconds(30) } })
  async sign(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body('kmhAccountId') kmhAccountId: string | undefined,
    @Req() req: Request,
  ): Promise<JSendSuccess<unknown>> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const contract = await this.contractService.signContract(
      user.id, id, ipAddress, userAgent, kmhAccountId,
    );
    return { status: 'success', data: contract };
  }

  @Post(':id/upload-document')
  @HttpCode(HttpStatus.OK)
  async uploadDocumentPhoto(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { photoBase64: string },
  ): Promise<JSendSuccess<unknown>> {
    const result = await this.contractService.uploadDocumentPhoto(id, user.id, body.photoBase64);
    return { status: 'success', data: result };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 1, ttl: seconds(30) } })
  async activate(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActivateContractDto,
  ): Promise<JSendSuccess<unknown>> {
    const contract = await this.contractService.activateContract(
      user.id, id, dto.uavtCode, dto.kmhAccountId,
    );
    return { status: 'success', data: contract };
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 1, ttl: seconds(60) } })
  async terminate(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ): Promise<JSendSuccess<unknown>> {
    const contract = await this.contractService.terminate(user.id, id, reason || 'Taraf talebi');
    return { status: 'success', data: contract };
  }
}
