import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Public()
  @Get()
  async findAll() {
    const articles = await this.articleService.findAllPublished();
    return { status: 'success', data: articles };
  }

  @Public()
  @Get('latest')
  async findLatest(@Query('limit') limit?: string) {
    const articles = await this.articleService.findLatest(limit ? parseInt(limit) : 3);
    return { status: 'success', data: articles };
  }

  @Public()
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const article = await this.articleService.findBySlug(slug);
    return { status: 'success', data: article };
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/drafts')
  async findDrafts() {
    const articles = await this.articleService.findAllDrafts();
    return { status: 'success', data: articles };
  }

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateArticleDto) {
    const article = await this.articleService.create(dto);
    return { status: 'success', data: article };
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    const article = await this.articleService.publish(id);
    return { status: 'success', data: article };
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    const article = await this.articleService.unpublish(id);
    return { status: 'success', data: article };
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.articleService.remove(id);
    return { status: 'success', data: null };
  }
}
