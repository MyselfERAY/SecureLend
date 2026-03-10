import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { PrismaUserRepository } from './prisma-user.repository';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
  exports: [UserService],
})
export class UserModule {}
