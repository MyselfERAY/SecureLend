import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { SuggestionService } from './suggestion.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, SuggestionStatus } from '@prisma/client';

@Controller('api/v1/suggestions')
@Roles(UserRole.ADMIN, UserRole.SERVICE)
export class SuggestionController {
  constructor(private readonly suggestionService: SuggestionService) {}

  @Get()
  async findAll(@Query('status') status?: SuggestionStatus) {
    const suggestions = await this.suggestionService.findAll(status);
    return { status: 'success', data: suggestions };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const suggestion = await this.suggestionService.findOne(id);
    return { status: 'success', data: suggestion };
  }

  @Post()
  async create(@Body() dto: CreateSuggestionDto) {
    const suggestion = await this.suggestionService.create(dto);
    return { status: 'success', data: suggestion };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSuggestionDto) {
    const suggestion = await this.suggestionService.update(id, dto);
    return { status: 'success', data: suggestion };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.suggestionService.remove(id);
    return { status: 'success', data: null };
  }
}
