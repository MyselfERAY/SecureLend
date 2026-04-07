import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ArticleAudience } from '@prisma/client';

export class CreateArticleDto {
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  slug!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  summary!: string;

  @IsString()
  @MinLength(20)
  content!: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsEnum(ArticleAudience)
  audience?: ArticleAudience;
}
