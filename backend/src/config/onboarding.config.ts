import { registerAs } from '@nestjs/config';

function parseCsv(value: string | undefined, fallback: string[]) {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const onboardingConfig = registerAs('onboarding', () => ({
  policyVersion: process.env.ONBOARDING_REVIEW_POLICY_VERSION?.trim() || 'v1',
  blockingMismatchFields: parseCsv(
    process.env.ONBOARDING_BLOCKING_MISMATCH_FIELDS,
    ['fullName', 'firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'faydaFin'],
  ),
  blockingMismatchApprovalRoles: parseCsv(
    process.env.ONBOARDING_BLOCKING_MISMATCH_APPROVAL_ROLES,
    ['head_office_manager', 'admin'],
  ),
  blockingMismatchApprovalReasonCodes: parseCsv(
    process.env.ONBOARDING_BLOCKING_MISMATCH_APPROVAL_REASON_CODES,
    ['official_source_verified', 'manual_document_review', 'customer_profile_corrected'],
  ),
  supersessionReasonCodes: parseCsv(
    process.env.ONBOARDING_SUPERSESSION_REASON_CODES,
    [
      'review_progressed',
      'customer_update_requested',
      'approval_recorded',
      'decision_corrected',
    ],
  ),
  requireApprovalJustification:
    (process.env.ONBOARDING_REQUIRE_APPROVAL_JUSTIFICATION ?? 'true') === 'true',
}));
