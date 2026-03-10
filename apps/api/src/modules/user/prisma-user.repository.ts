import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository, UpdateUserData } from './user.repository';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByTcknHash(tcknHash: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { tcknHash } });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async addRole(id: string, role: UserRole): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    if (user.roles.includes(role)) return user;
    return this.prisma.user.update({
      where: { id },
      data: { roles: { push: role } },
    });
  }
}
