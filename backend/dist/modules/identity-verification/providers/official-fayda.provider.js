"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficialFaydaVerificationProvider = void 0;
const common_1 = require("@nestjs/common");
let OfficialFaydaVerificationProvider = class OfficialFaydaVerificationProvider {
    constructor() {
        this.mode = 'official';
    }
    async start() {
        return {
            verificationMethod: 'official_online_ekyc',
            verificationStatus: 'pending_verification',
            verificationReference: `OFFICIAL-START-${Date.now()}`,
        };
    }
    async submitFin() {
        return {
            verificationMethod: 'official_online_ekyc',
            verificationStatus: 'pending_verification',
            verificationReference: `OFFICIAL-FIN-${Date.now()}`,
        };
    }
    async uploadQr() {
        return {
            verificationMethod: 'official_offline_qr',
            verificationStatus: 'pending_verification',
            verificationReference: `OFFICIAL-QR-${Date.now()}`,
        };
    }
    async verify() {
        return {
            verificationMethod: 'official_online_ekyc',
            verificationStatus: 'failed',
            verificationReference: `OFFICIAL-VERIFY-${Date.now()}`,
            failureReason: 'Official Fayda integration is not configured in this environment.',
        };
    }
};
exports.OfficialFaydaVerificationProvider = OfficialFaydaVerificationProvider;
exports.OfficialFaydaVerificationProvider = OfficialFaydaVerificationProvider = __decorate([
    (0, common_1.Injectable)()
], OfficialFaydaVerificationProvider);
//# sourceMappingURL=official-fayda.provider.js.map