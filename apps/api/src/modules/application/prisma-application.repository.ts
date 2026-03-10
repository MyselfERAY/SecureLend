import { Injectable } from '@nestjs/common';
import { Application } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApplicationRepository,
  CreateApplicationData,
} from './application.repository';

@Injectable()
export class PrismaApplicationRepository extends ApplicationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateApplicationData): Promise<Application> {
    return this.prisma.application.create({ data });
  }

  async findById(id: string): Promise<Application | null> {
    return this.prisma.application.findUnique({ where: { id } });
  }

  async findByTcknHash(tcknHash: string): Promise<Application[]> {
    return this.prisma.application.findMany({
      where: { tcknHash },
      orderBy: { createdAt: 'desc' },
    });
  }
}
