import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleStatus } from '@prisma/client';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublished() {
    return this.prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        category: true,
        audience: true,
        publishedAt: true,
      },
    });
  }

  async findLatest(limit = 3) {
    return this.prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        category: true,
        audience: true,
        publishedAt: true,
      },
    });
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article || article.status !== ArticleStatus.PUBLISHED) {
      throw new NotFoundException('Makale bulunamadi');
    }
    return article;
  }

  async findAllDrafts() {
    return this.prisma.article.findMany({
      where: { status: ArticleStatus.DRAFT },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateArticleDto) {
    const existing = await this.prisma.article.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Bu slug zaten kullanımda');
    }
    return this.prisma.article.create({ data: dto });
  }

  async publish(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Makale bulunamadi');
    return this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Makale bulunamadi');
    return this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.DRAFT, publishedAt: null },
    });
  }

  async remove(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Makale bulunamadi');
    await this.prisma.article.delete({ where: { id } });
  }
}
