import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
export declare class SlotsController {
    private slots;
    constructor(slots: SlotsService);
    create(req: any, dto: CreateSlotDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }>;
    mySlots(req: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }[]>;
    available(doctorId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }[]>;
    update(req: any, id: number, dto: UpdateSlotDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }>;
    remove(req: any, id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        start: Date;
        end: Date;
        isBooked: boolean;
        doctorId: number;
    }>;
}
