import { expect, test } from '@playwright/test';

test('head office admin can send a notification campaign and backend logs reflect it', async ({
  page,
  request,
}) => {
  const unique = Date.now();
  const uniqueSubject = `Playwright Notification ${unique}`;
  const uniqueBody = `Playwright notification body ${unique}`;

  await page.goto('/');
  await expect(page.getByText('Secure Head Office Staff Login')).toBeVisible();
  await page.getByLabel('Staff Email or Identifier').fill(
    'admin.head-office@bunnabank.com',
  );
  await page.getByLabel('Password').fill('demo-pass');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Sign Out')).toBeVisible();
  await page.getByRole('button', { name: /Notifications Broadcast and event notifications/i }).click();

  await expect(
    page.getByRole('heading', { name: 'Create Reminder Campaign' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Reminder' })).toBeEnabled();

  await page.getByLabel('Target Type').selectOption('selected_customers');
  await page.getByLabel('Target IDs').fill('BUN-100001');
  await page.getByLabel('Subject').fill(uniqueSubject);
  await page.getByLabel('Intro / Body Note').fill(uniqueBody);

  const channelRow = page.locator('.channel-row').first();
  for (const channelName of ['Mobile Push', 'Sms', 'Telegram']) {
    const chip = channelRow.getByRole('button', { name: channelName });
    if (((await chip.getAttribute('class')) ?? '').includes('active')) {
      await chip.click();
    }
  }

  const emailChip = channelRow.getByRole('button', { name: 'Email' });
  if (!((await emailChip.getAttribute('class')) ?? '').includes('active')) {
    await emailChip.click();
  }
  await expect(channelRow.locator('.channel-chip.active')).toHaveCount(1);
  await expect(emailChip).toHaveClass(/active/);
  await expect(page.getByLabel('Subject')).toHaveValue(uniqueSubject);
  await expect(page.getByLabel('Intro / Body Note')).toHaveValue(uniqueBody);

  await page.getByRole('button', { name: 'Send Reminder' }).click();

  await expect(page.getByText('Campaign Results')).toBeVisible();

  const adminLoginResponse = await request.post(
    'http://127.0.0.1:4000/auth/staff/login',
    {
      data: {
        identifier: 'admin.head-office@bunnabank.com',
        password: 'demo-pass',
      },
    },
  );
  expect(adminLoginResponse.ok()).toBeTruthy();
  const adminAuth = (await adminLoginResponse.json()) as { accessToken: string };

  let campaignId: string | null = null;
  await expect
    .poll(
      async () => {
        const campaignsResponse = await request.get(
          'http://127.0.0.1:4000/manager/notifications/campaigns',
          {
            headers: {
              Authorization: `Bearer ${adminAuth.accessToken}`,
            },
          },
        );
        expect(campaignsResponse.ok()).toBeTruthy();
        const campaigns = (await campaignsResponse.json()) as Array<{
          _id: string;
          messageSubject?: string;
          status: string;
        }>;
        const matching = campaigns.find(
          (campaign) => campaign.messageSubject === uniqueSubject,
        );
        campaignId = matching?.status === 'completed' ? matching._id : null;
        return campaignId;
      },
      { timeout: 15000 },
    )
    .not.toBeNull();
  expect(campaignId).toBeTruthy();

  await expect
    .poll(
      async () => {
        const logsResponse = await request.get(
          `http://127.0.0.1:4000/manager/notifications/logs/${campaignId}`,
          {
            headers: {
              Authorization: `Bearer ${adminAuth.accessToken}`,
            },
          },
        );
        expect(logsResponse.ok()).toBeTruthy();
        const logs = (await logsResponse.json()) as Array<{
          channel: string;
          messageSubject?: string;
          recipient: string;
        }>;
        const emailLog = logs.find((log) => log.channel === 'email');
        return emailLog?.messageSubject === uniqueSubject ? emailLog.recipient : null;
      },
      { timeout: 15000 },
    )
    .toBeTruthy();
});
