import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/strategies/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../users/enums/role.enum';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RescheduleDto } from './dto/reschedule.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appts: AppointmentsService) {}

  // Patients book
  @Roles(Role.PATIENT)
  @Post('book')
  book(@Req() req: any, @Body() dto: BookAppointmentDto) {
    return this.appts.book(req.user.id, dto.doctorId, dto.slotId);
  }

  // Patient views own
  @Roles(Role.PATIENT)
  @Get('me')
  my(@Req() req: any) {
    return this.appts.myAppointments(req.user.id);
  }

  // Doctor views their appointments
  @Roles(Role.DOCTOR)
  @Get('doctor/me')
  doctorMine(@Req() req: any) {
    return this.appts.doctorAppointments(req.user.id);
  }

  // Doctor confirms/cancels (status: CONFIRMED | CANCELLED)
  @Roles(Role.DOCTOR)
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.appts.updateStatus(req.user.id, id, dto.status);
  }

  // Doctor reschedules to another free slot they own
  @Roles(Role.DOCTOR)
  @Patch(':id/reschedule')
  reschedule(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleDto,
  ) {
    return this.appts.reschedule(req.user.id, id, dto.newSlotId);
  }
}
