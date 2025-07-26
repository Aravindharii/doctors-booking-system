import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/strategies/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Role } from '../users/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('slots')
export class SlotsController {
  constructor(private slots: SlotsService) {}

  // Doctor creates an available slot
  @Roles(Role.DOCTOR)
  @Post()
  create(@Req() req: any, @Body() dto: CreateSlotDto) {
    return this.slots.create(req.user.id, dto);
  }

  // Doctor views own slots
  @Roles(Role.DOCTOR)
  @Get('me')
  mySlots(@Req() req: any) {
    return this.slots.findMine(req.user.id);
  }

  // Patients (or anyone) can view a doctor's available future slots
  @Get('doctor/:doctorId')
  available(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.slots.findAvailableForDoctor(doctorId);
  }

  // Doctor updates a slot
  @Roles(Role.DOCTOR)
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.slots.update(req.user.id, id, dto);
  }

  // Doctor deletes a slot
  @Roles(Role.DOCTOR)
  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.slots.delete(req.user.id, id);
  }
}
