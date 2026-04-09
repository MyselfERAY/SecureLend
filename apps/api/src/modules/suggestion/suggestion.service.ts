import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SuggestionStatus } from '@prisma/client';

@Injectable()
export class SuggestionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: SuggestionStatus) {
    return this.prisma.devSuggestion.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const suggestion = await this.prisma.devSuggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException('Oneri bulunamadi');
    return suggestion;
  }

  async create(dto: CreateSuggestionDto) {
    return this.prisma.devSuggestion.create({ data: dto });
  }

  async update(id: string, dto: UpdateSuggestionDto) {
    await this.findOne(id);
    return this.prisma.devSuggestion.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.devSuggestion.delete({ where: { id } });
  }
}
