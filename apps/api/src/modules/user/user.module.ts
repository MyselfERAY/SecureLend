import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { PrismaUserRepository } from './prisma-user.repository';
import { GdprDeletionService } from './gdpr-deletion.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    GdprDeletionService,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
  exports: [UserService],
})
export class UserModule {}
