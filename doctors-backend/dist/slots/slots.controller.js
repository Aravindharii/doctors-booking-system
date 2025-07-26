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
exports.SlotsController = void 0;
const common_1 = require("@nestjs/common");
const slots_service_1 = require("./slots.service");
const jwt_strategy_1 = require("../auth/strategies/jwt.strategy");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const create_slot_dto_1 = require("./dto/create-slot.dto");
const update_slot_dto_1 = require("./dto/update-slot.dto");
const role_enum_1 = require("../users/enums/role.enum");
let SlotsController = class SlotsController {
    slots;
    constructor(slots) {
        this.slots = slots;
    }
    create(req, dto) {
        return this.slots.create(req.user.id, dto);
    }
    mySlots(req) {
        return this.slots.findMine(req.user.id);
    }
    available(doctorId) {
        return this.slots.findAvailableForDoctor(doctorId);
    }
    update(req, id, dto) {
        return this.slots.update(req.user.id, id, dto);
    }
    remove(req, id) {
        return this.slots.delete(req.user.id, id);
    }
};
exports.SlotsController = SlotsController;
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_slot_dto_1.CreateSlotDto]),
    __metadata("design:returntype", void 0)
], SlotsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SlotsController.prototype, "mySlots", null);
__decorate([
    (0, common_1.Get)('doctor/:doctorId'),
    __param(0, (0, common_1.Param)('doctorId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SlotsController.prototype, "available", null);
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_slot_dto_1.UpdateSlotDto]),
    __metadata("design:returntype", void 0)
], SlotsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], SlotsController.prototype, "remove", null);
exports.SlotsController = SlotsController = __decorate([
    (0, common_1.UseGuards)(jwt_strategy_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('slots'),
    __metadata("design:paramtypes", [slots_service_1.SlotsService])
], SlotsController);
//# sourceMappingURL=slots.controller.js.map