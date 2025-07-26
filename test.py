#!/usr/bin/env python3
"""
scaffold_nest_prisma.py

Usage:
    python scaffold_nest_prisma.py my-backend

This will:
- `npx @nestjs/cli new my-backend --skip-git --skip-install -p npm`
- Install all dependencies
- Initialize Prisma, create the schema, run the first migration
- Write all NestJS auth/users/prisma files
- Add role-based access control
- Add TimeSlots (doctor availability) & Appointments (patient booking + doctor confirm/cancel/reschedule)
"""

import sys
import subprocess
from pathlib import Path
import textwrap

def sh(cmd, cwd=None):
    print(f"→ {cmd}")
    subprocess.run(cmd, shell=True, check=True, cwd=cwd)

def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip("\n"), encoding="utf-8")
    print(f"  wrote {path}")

def ensure_tools():
    try:
        subprocess.run("node -v", shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.run("npm -v", shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.run("npx -v", shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError:
        print("❌ You need Node.js, npm, and npx installed in your PATH.")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scaffold_nest_prisma.py <project-name>")
        sys.exit(1)

    project_name = sys.argv[1]
    project_dir = Path(project_name).resolve()

    ensure_tools()

    if not project_dir.exists():
        sh(f'npx @nestjs/cli new {project_name} --skip-git --skip-install -p npm')
    else:
        print(f"⚠️  Directory {project_dir} already exists. Proceeding, but files may be overwritten.")

    # Install deps
    sh("npm i", cwd=project_dir)
    sh("npm i @prisma/client pg @nestjs/jwt passport passport-jwt bcrypt class-validator class-transformer @nestjs/config", cwd=project_dir)
    sh("npm i -D prisma @types/bcrypt @types/passport-jwt", cwd=project_dir)

    # Init Prisma
    sh("npx prisma init", cwd=project_dir)

    # .env
    write(project_dir / ".env", f"""
    DATABASE_URL="postgresql://postgres:admin@localhost:5432/doctors_backend?schema=public"
    JWT_SECRET=supersecret
    JWT_EXPIRES_IN=7d
    """)

    # prisma/schema.prisma
    write(project_dir / "prisma/schema.prisma", """
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    enum Role {
      DOCTOR
      PATIENT
    }

    enum AppointmentStatus {
      PENDING
      CONFIRMED
      CANCELLED
    }

    model User {
      id           Int           @id @default(autoincrement())
      name         String
      email        String        @unique
      password     String
      role         Role          @default(PATIENT)
      createdAt    DateTime      @default(now())
      updatedAt    DateTime      @updatedAt

      // relations
      doctorSlots  TimeSlot[]    @relation("DoctorSlots")
      asDoctor     Appointment[] @relation("DoctorAppointments")
      asPatient    Appointment[] @relation("PatientAppointments")
    }

    model TimeSlot {
      id        Int        @id @default(autoincrement())
      doctorId  Int
      doctor    User       @relation("DoctorSlots", fields: [doctorId], references: [id])
      start     DateTime
      end       DateTime
      isBooked  Boolean    @default(false)
      createdAt DateTime   @default(now())
      updatedAt DateTime   @updatedAt

      appointments Appointment[]
    }

    model Appointment {
      id         Int                @id @default(autoincrement())
      patientId  Int
      doctorId   Int
      slotId     Int
      status     AppointmentStatus  @default(PENDING)

      patient    User       @relation("PatientAppointments", fields: [patientId], references: [id])
      doctor     User       @relation("DoctorAppointments", fields: [doctorId], references: [id])
      slot       TimeSlot   @relation(fields: [slotId], references: [id])

      createdAt  DateTime   @default(now())
      updatedAt  DateTime   @updatedAt
    }
    """)

    # src/main.ts
    write(project_dir / "src/main.ts", """
    import { ValidationPipe } from '@nestjs/common';
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
      await app.listen(3000);
      console.log('Server running on http://localhost:3000');
    }
    bootstrap();
    """)

    # src/app.module.ts
    write(project_dir / "src/app.module.ts", """
    import { Module } from '@nestjs/common';
    import { ConfigModule } from '@nestjs/config';
    import { PrismaModule } from './prisma/prisma.module';
    import { UsersModule } from './users/users.module';
    import { AuthModule } from './auth/auth.module';
    import { SlotsModule } from './slots/slots.module';
    import { AppointmentsModule } from './appointments/appointments.module';

    @Module({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
        SlotsModule,
        AppointmentsModule,
      ],
    })
    export class AppModule {}
    """)

    # src/prisma/prisma.module.ts
    write(project_dir / "src/prisma/prisma.module.ts", """
    import { Global, Module } from '@nestjs/common';
    import { PrismaService } from './prisma.service';

    @Global()
    @Module({
      providers: [PrismaService],
      exports: [PrismaService],
    })
    export class PrismaModule {}
    """)

    # src/prisma/prisma.service.ts
    write(project_dir / "src/prisma/prisma.service.ts", """
    import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
    import { PrismaClient } from '@prisma/client';

    @Injectable()
    export class PrismaService extends PrismaClient implements OnModuleInit {
      async onModuleInit() {
        await this.$connect();
      }

      async enableShutdownHooks(app: INestApplication) {
        this.$on('beforeExit', async () => {
          await app.close();
        });
      }
    }
    """)

    # common: roles decorator & guard
    write(project_dir / "src/common/decorators/roles.decorator.ts", """
    import { SetMetadata } from '@nestjs/common';
    export const ROLES_KEY = 'roles';
    export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
    """)

    write(project_dir / "src/common/guards/roles.guard.ts", """
    import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
    import { Reflector } from '@nestjs/core';
    import { ROLES_KEY } from '../decorators/roles.decorator';

    @Injectable()
    export class RolesGuard implements CanActivate {
      constructor(private reflector: Reflector) {}

      canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const { user } = context.switchToHttp().getRequest();
        return requiredRoles.includes(user?.role);
      }
    }
    """)

    # users
    write(project_dir / "src/users/enums/role.enum.ts", """
    export enum Role {
      DOCTOR = 'DOCTOR',
      PATIENT = 'PATIENT',
    }
    """)

    write(project_dir / "src/users/users.module.ts", """
    import { Module } from '@nestjs/common';
    import { UsersService } from './users.service';

    @Module({
      providers: [UsersService],
      exports: [UsersService],
    })
    export class UsersModule {}
    """)

    write(project_dir / "src/users/users.service.ts", """
    import { ConflictException, Injectable } from '@nestjs/common';
    import * as bcrypt from 'bcrypt';
    import { PrismaService } from '../prisma/prisma.service';
    import { Role } from './enums/role.enum';

    @Injectable()
    export class UsersService {
      constructor(private prisma: PrismaService) {}

      async create(name: string, email: string, password: string, role: Role) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) throw new ConflictException('Email already registered');

        const hash = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
          data: { name, email, password: hash, role },
        });
      }

      findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
      }

      findById(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
      }
    }
    """)

    # auth
    write(project_dir / "src/auth/dto/register.dto.ts", """
    import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
    import { Role } from '../../users/enums/role.enum';

    export class RegisterDto {
      @IsNotEmpty()
      name: string;

      @IsEmail()
      email: string;

      @MinLength(6)
      password: string;

      @IsEnum(Role)
      role: Role;
    }
    """)

    write(project_dir / "src/auth/dto/login.dto.ts", """
    import { IsEmail, IsNotEmpty } from 'class-validator';

    export class LoginDto {
      @IsEmail()
      email: string;

      @IsNotEmpty()
      password: string;
    }
    """)

    write(project_dir / "src/auth/auth.module.ts", """
    import { Module } from '@nestjs/common';
    import { JwtModule } from '@nestjs/jwt';
    import { PassportModule } from '@nestjs/passport';
    import { ConfigModule, ConfigService } from '@nestjs/config';
    import { UsersModule } from '../users/users.module';
    import { AuthService } from './auth.service';
    import { AuthController } from './auth.controller';
    import { JwtStrategy } from './strategies/jwt.strategy';

    @Module({
      imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (cfg: ConfigService) => ({
            secret: cfg.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '7d' },
          }),
        }),
      ],
      providers: [AuthService, JwtStrategy],
      controllers: [AuthController],
      exports: [AuthService],
    })
    export class AuthModule {}
    """)

    write(project_dir / "src/auth/auth.service.ts", """
    import { Injectable, UnauthorizedException } from '@nestjs/common';
    import * as bcrypt from 'bcrypt';
    import { JwtService } from '@nestjs/jwt';
    import { UsersService } from '../users/users.service';
    import { Role } from '../users/enums/role.enum';

    @Injectable()
    export class AuthService {
      constructor(private users: UsersService, private jwt: JwtService) {}

      async register(name: string, email: string, password: string, role: Role) {
        const user = await this.users.create(name, email, password, role);
        return this.signPayload(user);
      }

      async login(email: string, password: string) {
        const user = await this.users.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new UnauthorizedException('Invalid credentials');
        return this.signPayload(user);
      }

      private signPayload(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const token = this.jwt.sign(payload);
        return {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
      }
    }
    """)

    write(project_dir / "src/auth/auth.controller.ts", """
    import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
    import { AuthService } from './auth.service';
    import { RegisterDto } from './dto/register.dto';
    import { LoginDto } from './dto/login.dto';
    import { JwtAuthGuard } from './strategies/jwt.strategy';

    @Controller('auth')
    export class AuthController {
      constructor(private auth: AuthService) {}

      @Post('register')
      register(@Body() dto: RegisterDto) {
        return this.auth.register(dto.name, dto.email, dto.password, dto.role);
      }

      @Post('login')
      login(@Body() dto: LoginDto) {
        return this.auth.login(dto.email, dto.password);
      }

      @UseGuards(JwtAuthGuard)
      @Get('me')
      me(@Req() req: any) {
        return req.user;
      }
    }
    """)

    write(project_dir / "src/auth/strategies/jwt.strategy.ts", """
    import { Injectable } from '@nestjs/common';
    import { PassportStrategy } from '@nestjs/passport';
    import { ExtractJwt, Strategy } from 'passport-jwt';
    import { AuthGuard } from '@nestjs/passport';
    import { ConfigService } from '@nestjs/config';

    @Injectable()
    export class JwtStrategy extends PassportStrategy(Strategy) {
      constructor(cfg: ConfigService) {
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: cfg.get<string>('JWT_SECRET'),
        });
      }

      async validate(payload: any) {
        return { id: payload.sub, email: payload.email, role: payload.role };
      }
    }

    export class JwtAuthGuard extends AuthGuard('jwt') {}
    """)

    # slots module
    write(project_dir / "src/slots/dto/create-slot.dto.ts", """
    import { IsDateString } from 'class-validator';

    export class CreateSlotDto {
      @IsDateString()
      start: string;

      @IsDateString()
      end: string;
    }
    """)

    write(project_dir / "src/slots/dto/update-slot.dto.ts", """
    import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

    export class UpdateSlotDto {
      @IsOptional()
      @IsDateString()
      start?: string;

      @IsOptional()
      @IsDateString()
      end?: string;

      @IsOptional()
      @IsBoolean()
      isBooked?: boolean;
    }
    """)

    write(project_dir / "src/slots/slots.module.ts", """
    import { Module } from '@nestjs/common';
    import { SlotsService } from './slots.service';
    import { SlotsController } from './slots.controller';

    @Module({
      controllers: [SlotsController],
      providers: [SlotsService],
      exports: [SlotsService],
    })
    export class SlotsModule {}
    """)

    write(project_dir / "src/slots/slots.service.ts", """
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
    """)

    write(project_dir / "src/slots/slots.controller.ts", """
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
    """)

    # appointments module
    write(project_dir / "src/appointments/dto/book-appointment.dto.ts", """
    import { IsInt } from 'class-validator';

    export class BookAppointmentDto {
      @IsInt()
      doctorId: number;

      @IsInt()
      slotId: number;
    }
    """)

    write(project_dir / "src/appointments/dto/update-status.dto.ts", """
    import { IsEnum } from 'class-validator';
    import { AppointmentStatus } from '@prisma/client';

    export class UpdateStatusDto {
      @IsEnum(AppointmentStatus)
      status: AppointmentStatus;
    }
    """)

    write(project_dir / "src/appointments/dto/reschedule.dto.ts", """
    import { IsInt } from 'class-validator';

    export class RescheduleDto {
      @IsInt()
      newSlotId: number;
    }
    """)

    write(project_dir / "src/appointments/appointments.module.ts", """
    import { Module } from '@nestjs/common';
    import { AppointmentsService } from './appointments.service';
    import { AppointmentsController } from './appointments.controller';

    @Module({
      controllers: [AppointmentsController],
      providers: [AppointmentsService],
    })
    export class AppointmentsModule {}
    """)

    write(project_dir / "src/appointments/appointments.service.ts", """
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
    """)

    write(project_dir / "src/appointments/appointments.controller.ts", """
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
    """)

    # Run prisma migrate
    print("\n🚀 Running initial Prisma migration...")
    sh("npx prisma migrate dev --name init", cwd=project_dir)

    print("\n✅ Done!")
    print(f"""
Your backend is ready.

Next steps:
  cd {project_name}
  npm run start:dev

Auth:
  POST /auth/register  -> {{ name, email, password, role: "DOCTOR" | "PATIENT" }}
  POST /auth/login     -> {{ email, password }}
  GET  /auth/me        -> Bearer <token>

Doctor (role=DOCTOR):
  POST   /slots                     (create slot: {{ start, end }})
  GET    /slots/me                  (list my slots)
  PATCH  /slots/:id                 (update my slot)
  DELETE /slots/:id                 (delete my slot)

  GET    /appointments/doctor/me    (list my appointments)
  PATCH  /appointments/:id/status   ({{ status: "CONFIRMED" | "CANCELLED" }})
  PATCH  /appointments/:id/reschedule ({{ newSlotId }})

Patient (role=PATIENT):
  GET    /slots/doctor/:doctorId    (view available future, unbooked slots)
  POST   /appointments/book         ({{ doctorId, slotId }})
  GET    /appointments/me           (my booked appointments)

Enjoy!
""")

if __name__ == "__main__":
    main()
