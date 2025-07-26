// src/doctors/doctors.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { UsersService } from '../users/users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.PATIENT, Role.DOCTOR) // both can see this list (tweak as you like)
  @Get()
  async list() {
    return this.usersService.findAllDoctors();
  }
}
