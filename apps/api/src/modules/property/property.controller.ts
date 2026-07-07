import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import type { JSendSuccess } from '@securelend/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';

@ApiTags('Property')
@ApiBearerAuth('access-token')
@Controller('api/v1/properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @Throttle({ short: { limit: 2, ttl: seconds(10) } })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePropertyDto,
  ): Promise<JSendSuccess<unknown>> {
    const property = await this.propertyService.create(user.id, dto as any);
    return { status: 'success', data: property };
  }

  @Get('my')
  async getMyProperties(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<unknown>> {
    const properties = await this.propertyService.getMyProperties(user.id);
    return { status: 'success', data: properties };
  }

  @Get('search')
  async search(
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('minRent') minRent?: string,
    @Query('maxRent') maxRent?: string,
  ): Promise<JSendSuccess<unknown>> {
    const properties = await this.propertyService.search({
      city,
      district,
      minRent: minRent ? Number(minRent) : undefined,
      maxRent: maxRent ? Number(maxRent) : undefined,
    });
    return { status: 'success', data: properties };
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JSendSuccess<unknown>> {
    const property = await this.propertyService.getById(id);
    return { status: 'success', data: property };
  }

  @Patch(':id')
  @Throttle({ short: { limit: 2, ttl: seconds(10) } })
  async update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreatePropertyDto>,
  ): Promise<JSendSuccess<unknown>> {
    const property = await this.propertyService.update(user.id, id, dto as any);
    return { status: 'success', data: property };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { limit: 1, ttl: seconds(10) } })
  async deactivate(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.propertyService.deactivate(user.id, id);
  }
}
