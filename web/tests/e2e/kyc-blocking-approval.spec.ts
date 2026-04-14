import { expect, test } from '@playwright/test';
import { randomInt, randomUUID } from 'crypto';

const tinyPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl9l1wAAAAASUVORK5CYII=',
  'base64',
);

function randomDigits(length: number) {
  let value = '';
  while (value.length < length) {
    value += String(randomInt(0, 10));
  }
  return value.slice(0, length);
}

test('admin can approve a blocking KYC mismatch with step-up verification', async ({
  page,
  request,
}) => {
  const seed = randomUUID().replace(/-/g, '');
  const unique = seed.slice(0, 12);
  const numericSeed = randomDigits(8);
  const entityId = `playwright-kyc-blocking-${unique}`;
  const fullName = `Blocking Kyc ${unique}`;
  const firstName = 'Blocking';
  const lastName = `Kyc ${unique}`;
  const phoneNumber = `0943${numericSeed.slice(0, 6)}`;
  const email = `playwright.blocking.kyc.${unique}@example.com`;
  const faydaFin = `5259${numericSeed.slice(0, 8)}`;

  const upload = async (documentType: 'fayda_front' | 'fayda_back' | 'selfie') => {
    const response = await request.post(
      'http://127.0.0.1:4000/uploads/public-onboarding-documents',
      {
        multipart: {
          file: {
            name: `${documentType}.png`,
            mimeType: 'image/png',
            buffer: tinyPngBuffer,
          },
          domain: 'onboarding',
          entityId,
          documentType,
        },
      },
    );

    expect(response.ok()).toBeTruthy();
    return (await response.json()) as { storageKey: string };
  };

  const [front, back, selfie] = await Promise.all([
    upload('fayda_front'),
    upload('fayda_back'),
    upload('selfie'),
  ]);

  const registerResponse = await request.post(
    'http://127.0.0.1:4000/auth/register',
    {
      data: {
        firstName,
        lastName,
        phoneNumber,
        email,
        dateOfBirth: '1982-05-25',
        region: 'National',
        city: 'Addis Ababa',
        preferredBranchName: 'Bahir Dar Branch',
        password: '1234',
        confirmPassword: '1234',
        faydaFin,
        faydaQrData: `front:${front.storageKey}|back:${back.storageKey}|selfie:${selfie.storageKey}`,
        faydaFrontImage: front.storageKey,
        faydaBackImage: back.storageKey,
        consentAccepted: true,
        extractedFaydaData: {
          fullName,
          firstName,
          lastName,
          dateOfBirth: '1990-02-02',
          sex: 'Male',
          phoneNumber,
          nationality: 'Ethiopian',
          region: 'National',
          city: 'Addis Ababa',
          subCity: 'Bole',
          woreda: '07',
          faydaFin,
          serialNumber: `SN-${unique}`,
          cardNumber: `CARD-${unique}`,
          dateOfBirthCandidates: ['1982-05-25', '1990-02-02'],
          expiryDateCandidates: ['2025-06-30', '2033-03-09'],
          reviewRequiredFields: ['dateOfBirth', 'expiryDate'],
          extractionMethod: 'playwright_blocking_e2e',
        },
      },
    },
  );

  expect(registerResponse.ok()).toBeTruthy();
  const registration = (await registerResponse.json()) as { customerId: string };

  await page.goto('/');
  await expect(page.getByText('Secure Head Office Staff Login')).toBeVisible();
  await page.getByLabel('Staff Email or Identifier').fill(
    'admin.head-office@bunnabank.com',
  );
  await page.getByLabel('Password').fill('demo-pass');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Sign Out')).toBeVisible();
  await page.getByRole('button', { name: /KYC Queue/ }).click();

  const caseRow = page.getByRole('row').filter({ hasText: registration.customerId });
  await expect(caseRow).toContainText(fullName);

  await caseRow.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Approve Blocking KYC Mismatches')).toBeVisible();
  await page.getByRole('button', { name: 'Use local approval defaults' }).click();
  await page.getByRole('button', { name: 'Confirm approval' }).click();

  await expect(page.getByText('Approve Blocking KYC Mismatches')).toHaveCount(0);
  await expect(
    page.getByRole('row').filter({ hasText: registration.customerId }),
  ).toHaveCount(0);
});
