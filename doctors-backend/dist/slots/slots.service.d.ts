import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
export declare class SlotsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(doctorId: number, dto: CreateSlotDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }>;
    findMine(doctorId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }[]>;
    findAvailableForDoctor(doctorId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }[]>;
    update(doctorId: number, id: number, dto: UpdateSlotDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }>;
    delete(doctorId: number, id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }>;
}
