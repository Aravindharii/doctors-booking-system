import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RescheduleDto } from './dto/reschedule.dto';
export declare class AppointmentsController {
    private appts;
    constructor(appts: AppointmentsService);
    book(req: any, dto: BookAppointmentDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        doctorId: number;
        patientId: number;
        slotId: number;
        status: import(".prisma/client").$Enums.AppointmentStatus;
    }>;
    my(req: any): Promise<({
        doctor: {
            id: number;
            name: string;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        slot: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            start: Date;
            end: Date;
            isBooked: boolean;
            doctorId: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        doctorId: number;
        patientId: number;
        slotId: number;
        status: import(".prisma/client").$Enums.AppointmentStatus;
    })[]>;
    doctorMine(req: any): Promise<({
        patient: {
            id: number;
            name: string;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        slot: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            start: Date;
            end: Date;
            isBooked: boolean;
            doctorId: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        doctorId: number;
        patientId: number;
        slotId: number;
        status: import(".prisma/client").$Enums.AppointmentStatus;
    })[]>;
    updateStatus(req: any, id: number, dto: UpdateStatusDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        doctorId: number;
        patientId: number;
        slotId: number;
        status: import(".prisma/client").$Enums.AppointmentStatus;
    }>;
    reschedule(req: any, id: number, dto: RescheduleDto): Promise<{
        patient: {
            id: number;
            name: string;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        slot: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            start: Date;
            end: Date;
            isBooked: boolean;
            doctorId: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        doctorId: number;
        patientId: number;
        slotId: number;
        status: import(".prisma/client").$Enums.AppointmentStatus;
    }>;
}
