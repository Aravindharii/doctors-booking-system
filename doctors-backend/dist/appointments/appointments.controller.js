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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const appointments_service_1 = require("./appointments.service");
const jwt_strategy_1 = require("../auth/strategies/jwt.strategy");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../users/enums/role.enum");
const book_appointment_dto_1 = require("./dto/book-appointment.dto");
const update_status_dto_1 = require("./dto/update-status.dto");
const reschedule_dto_1 = require("./dto/reschedule.dto");
let AppointmentsController = class AppointmentsController {
    appts;
    constructor(appts) {
        this.appts = appts;
    }
    book(req, dto) {
        return this.appts.book(req.user.id, dto.doctorId, dto.slotId);
    }
    my(req) {
        return this.appts.myAppointments(req.user.id);
    }
    doctorMine(req) {
        return this.appts.doctorAppointments(req.user.id);
    }
    updateStatus(req, id, dto) {
        return this.appts.updateStatus(req.user.id, id, dto.status);
    }
    reschedule(req, id, dto) {
        return this.appts.reschedule(req.user.id, id, dto.newSlotId);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT),
    (0, common_1.Post)('book'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, book_appointment_dto_1.BookAppointmentDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "book", null);
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "my", null);
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, common_1.Get)('doctor/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "doctorMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_status_dto_1.UpdateStatusDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "updateStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, common_1.Patch)(':id/reschedule'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, reschedule_dto_1.RescheduleDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "reschedule", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, common_1.UseGuards)(jwt_strategy_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('appointments'),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map