import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, email: string, password: string, role: Role) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { name, email, password: hash, role },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** 👇 NEW */
  async findAllDoctors() {
    return this.prisma.user.findMany({
      where: { role: Role.DOCTOR },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
