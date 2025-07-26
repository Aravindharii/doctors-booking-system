import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async book(patientId: number, doctorId: number, slotId: number) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id: slotId } });
    if (!slot || slot.doctorId !== doctorId) throw new NotFoundException('Slot not found');
    if (slot.isBooked) throw new ForbiddenException('Slot already booked');

    // mark slot booked & create appointment atomically
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
          status: AppointmentStatus.PENDING,
        },
      });
    });
  }

  async myAppointments(patientId: number) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: { slot: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async doctorAppointments(doctorId: number) {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      include: { slot: true, patient: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(doctorId: number, id: number, status: AppointmentStatus) {
    const appt = await this.prisma.appointment.findUnique({ where: { id }, include: { slot: true } });
    if (!appt || appt.doctorId != doctorId) throw new NotFoundException('Appointment not found');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
    });

    // If doctor cancels, optionally free the slot
    if (status === AppointmentStatus.CANCELLED) {
      await this.prisma.timeSlot.update({ where: { id: appt.slotId }, data: { isBooked: false } });
    }
    return updated;
  }

  async reschedule(doctorId: number, id: number, newSlotId: number) {
    const appt = await this.prisma.appointment.findUnique({ where: { id }, include: { slot: true } });
    if (!appt || appt.doctorId != doctorId) throw new NotFoundException('Appointment not found');

    const newSlot = await this.prisma.timeSlot.findUnique({ where: { id: newSlotId } });
    if (!newSlot || newSlot.doctorId !== doctorId) throw new NotFoundException('New slot not found');
    if (newSlot.isBooked) throw new ForbiddenException('New slot already booked');

    return this.prisma.$transaction(async (tx) => {
      // free old slot
      await tx.timeSlot.update({ where: { id: appt.slotId }, data: { isBooked: false } });
      // book new slot
      await tx.timeSlot.update({ where: { id: newSlotId }, data: { isBooked: true } });

      return tx.appointment.update({
        where: { id },
        data: {
          slotId: newSlotId,
          status: AppointmentStatus.PENDING,
        },
        include: { slot: true, patient: true },
      });
    });
  }
}
