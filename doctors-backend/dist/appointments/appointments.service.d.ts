import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
export declare class AppointmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    book(patientId: number, doctorId: number, slotId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        doctorId: number;
        patientId: number;
        slotId: number;
        status: import(".prisma/client").$Enums.AppointmentStatus;
    }>;
    myAppointments(patientId: number): Promise<({
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
    doctorAppointments(doctorId: number): Promise<({
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
    updateStatus(doctorId: number, id: number, status: AppointmentStatus): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        doctorId: number;
        patientId: number;
        slotId: number;
        status: import(".prisma/client").$Enums.AppointmentStatus;
    }>;
    reschedule(doctorId: number, id: number, newSlotId: number): Promise<{
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
