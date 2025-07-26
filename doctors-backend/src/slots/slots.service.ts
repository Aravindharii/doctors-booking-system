import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async create(doctorId: number, dto: CreateSlotDto) {
    const start = new Date(dto.start);
    const end = new Date(dto.end);
    if (end <= start) throw new ForbiddenException('end must be after start');

    return this.prisma.timeSlot.create({
      data: { doctorId, start, end },
    });
  }

  async findMine(doctorId: number) {
    return this.prisma.timeSlot.findMany({
      where: { doctorId },
      orderBy: { start: 'asc' },
    });
  }

  async findAvailableForDoctor(doctorId: number) {
    const now = new Date();
    return this.prisma.timeSlot.findMany({
      where: { doctorId, isBooked: false, start: { gte: now } },
      orderBy: { start: 'asc' },
    });
  }

  async update(doctorId: number, id: number, dto: UpdateSlotDto) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot || slot.doctorId !== doctorId) throw new NotFoundException('Slot not found');
    return this.prisma.timeSlot.update({
      where: { id },
      data: {
        start: dto.start ? new Date(dto.start) : undefined,
        end: dto.end ? new Date(dto.end) : undefined,
        isBooked: dto.isBooked ?? undefined,
      },
    });
  }

  async delete(doctorId: number, id: number) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot || slot.doctorId !== doctorId) throw new NotFoundException('Slot not found');
    return this.prisma.timeSlot.delete({ where: { id } });
  }
}
