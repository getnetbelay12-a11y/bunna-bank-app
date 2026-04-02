"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualReviewFaydaVerificationProvider = void 0;
const common_1 = require("@nestjs/common");
let ManualReviewFaydaVerificationProvider = class ManualReviewFaydaVerificationProvider {
    constructor() {
        this.mode = 'manual';
    }
    async start() {
        return {
            verificationMethod: 'fin_plus_manual_review',
            verificationStatus: 'pending_verification',
            verificationReference: `MANUAL-START-${Date.now()}`,
        };
    }
    async submitFin() {
        return {
            verificationMethod: 'fin_plus_manual_review',
            verificationStatus: 'pending_verification',
            verificationReference: `MANUAL-FIN-${Date.now()}`,
        };
    }
    async uploadQr() {
        return {
            verificationMethod: 'app_qr_capture_manual_review',
            verificationStatus: 'qr_uploaded',
            verificationReference: `MANUAL-QR-${Date.now()}`,
        };
    }
    async verify() {
        return {
            verificationMethod: 'fin_plus_manual_review',
            verificationStatus: 'manual_review_required',
            verificationReference: `MANUAL-VERIFY-${Date.now()}`,
            failureReason: 'Submitted for manual verification. Do not treat this as official Fayda validation.',
        };
    }
};
exports.ManualReviewFaydaVerificationProvider = ManualReviewFaydaVerificationProvider;
exports.ManualReviewFaydaVerificationProvider = ManualReviewFaydaVerificationProvider = __decorate([
    (0, common_1.Injectable)()
], ManualReviewFaydaVerificationProvider);
//# sourceMappingURL=manual-review-fayda.provider.js.map