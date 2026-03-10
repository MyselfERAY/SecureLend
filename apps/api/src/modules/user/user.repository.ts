import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  dateOfBirth?: Date;
  address?: string;
}

@Injectable()
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByTcknHash(tcknHash: string): Promise<User | null>;
  abstract update(id: string, data: UpdateUserData): Promise<User>;
  abstract addRole(id: string, role: UserRole): Promise<User>;
}
