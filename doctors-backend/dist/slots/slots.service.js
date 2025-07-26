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
exports.SlotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SlotsService = class SlotsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(doctorId, dto) {
        const start = new Date(dto.start);
        const end = new Date(dto.end);
        if (end <= start)
            throw new common_1.ForbiddenException('end must be after start');
        return this.prisma.timeSlot.create({
            data: { doctorId, start, end },
        });
    }
    async findMine(doctorId) {
        return this.prisma.timeSlot.findMany({
            where: { doctorId },
            orderBy: { start: 'asc' },
        });
    }
    async findAvailableForDoctor(doctorId) {
        const now = new Date();
        return this.prisma.timeSlot.findMany({
            where: { doctorId, isBooked: false, start: { gte: now } },
            orderBy: { start: 'asc' },
        });
    }
    async update(doctorId, id, dto) {
        const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
        if (!slot || slot.doctorId !== doctorId)
            throw new common_1.NotFoundException('Slot not found');
        return this.prisma.timeSlot.update({
            where: { id },
            data: {
                start: dto.start ? new Date(dto.start) : undefined,
                end: dto.end ? new Date(dto.end) : undefined,
                isBooked: dto.isBooked ?? undefined,
            },
        });
    }
    async delete(doctorId, id) {
        const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
        if (!slot || slot.doctorId !== doctorId)
            throw new common_1.NotFoundException('Slot not found');
        return this.prisma.timeSlot.delete({ where: { id } });
    }
};
exports.SlotsService = SlotsService;
exports.SlotsService = SlotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SlotsService);
//# sourceMappingURL=slots.service.js.map