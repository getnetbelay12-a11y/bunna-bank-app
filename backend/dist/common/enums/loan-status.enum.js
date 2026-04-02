"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanStatus = void 0;
var LoanStatus;
(function (LoanStatus) {
    LoanStatus["DRAFT"] = "draft";
    LoanStatus["SUBMITTED"] = "submitted";
    LoanStatus["BRANCH_REVIEW"] = "branch_review";
    LoanStatus["DISTRICT_REVIEW"] = "district_review";
    LoanStatus["HEAD_OFFICE_REVIEW"] = "head_office_review";
    LoanStatus["APPROVED"] = "approved";
    LoanStatus["REJECTED"] = "rejected";
    LoanStatus["DISBURSED"] = "disbursed";
    LoanStatus["CLOSED"] = "closed";
    LoanStatus["NEEDS_MORE_INFO"] = "needs_more_info";
})(LoanStatus || (exports.LoanStatus = LoanStatus = {}));
//# sourceMappingURL=loan-status.enum.js.map