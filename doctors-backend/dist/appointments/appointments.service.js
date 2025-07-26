"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AppointmentsService = class AppointmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async book(patientId, doctorId, slotId) {
        const slot = await this.prisma.timeSlot.findUnique({ where: { id: slotId } });
        if (!slot || slot.doctorId !== doctorId)
            throw new common_1.NotFoundException('Slot not found');
        if (slot.isBooked)
            throw new common_1.ForbiddenException('Slot already booked');
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.timeSlot.update({
                where: { id: slotId },
                data: { isBooked: true },
            });
            return tx.appointment.create({
                data: {
                    patientId,
                    doctorId,
                    slotId: updated.id,
                    status: client_1.AppointmentStatus.PENDING,
                },
            });
        });
    }
    async myAppointments(patientId) {
        return this.prisma.appointment.findMany({
            where: { patientId },
            include: { slot: true, doctor: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async doctorAppointments(doctorId) {
        return this.prisma.appointment.findMany({
            where: { doctorId },
            include: { slot: true, patient: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(doctorId, id, status) {
        const appt = await this.prisma.appointment.findUnique({ where: { id }, include: { slot: true } });
        if (!appt || appt.doctorId != doctorId)
            throw new common_1.NotFoundException('Appointment not found');
        const updated = await this.prisma.appointment.update({
            where: { id },
            data: { status },
        });
        if (status === client_1.AppointmentStatus.CANCELLED) {
            await this.prisma.timeSlot.update({ where: { id: appt.slotId }, data: { isBooked: false } });
        }
        return updated;
    }
    async reschedule(doctorId, id, newSlotId) {
        const appt = await this.prisma.appointment.findUnique({ where: { id }, include: { slot: true } });
        if (!appt || appt.doctorId != doctorId)
            throw new common_1.NotFoundException('Appointment not found');
        const newSlot = await this.prisma.timeSlot.findUnique({ where: { id: newSlotId } });
        if (!newSlot || newSlot.doctorId !== doctorId)
            throw new common_1.NotFoundException('New slot not found');
        if (newSlot.isBooked)
            throw new common_1.ForbiddenException('New slot already booked');
        return this.prisma.$transaction(async (tx) => {
            await tx.timeSlot.update({ where: { id: appt.slotId }, data: { isBooked: false } });
            await tx.timeSlot.update({ where: { id: newSlotId }, data: { isBooked: true } });
            return tx.appointment.update({
                where: { id },
                data: {
                    slotId: newSlotId,
                    status: client_1.AppointmentStatus.PENDING,
                },
                include: { slot: true, patient: true },
            });
        });
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map