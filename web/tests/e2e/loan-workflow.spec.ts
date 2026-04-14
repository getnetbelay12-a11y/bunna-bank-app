import { expect, test } from '@playwright/test';

const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://127.0.0.1:4000';

async function loginAsAdmin(request: Parameters<typeof test>[0]['request']) {
  const response = await request.post(`${apiBaseUrl}/auth/staff/login`, {
    data: {
      identifier: 'admin.head-office@bunnabank.com',
      password: 'demo-pass',
    },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { accessToken: string };
}

test('head office admin can open loan workflow and run a review action', async ({
  page,
  request,
}) => {
  const { accessToken } = await loginAsAdmin(request);

  const queueResponse = await request.get(`${apiBaseUrl}/loan-workflow/queue`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  expect(queueResponse.ok()).toBeTruthy();
  const queue = (await queueResponse.json()) as Array<{
    loanId: string;
    memberName: string;
    status: string;
    level: string;
  }>;

  const targetLoan =
    queue.find((item) => item.level === 'head_office' && item.status === 'head_office_review') ??
    queue[0];
  expect(targetLoan).toBeTruthy();

  const initialDetailResponse = await request.get(
    `${apiBaseUrl}/loan-workflow/queue/${targetLoan.loanId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  expect(initialDetailResponse.ok()).toBeTruthy();
  const initialDetail = (await initialDetailResponse.json()) as {
    history: Array<{ action: string }>;
  };

  await page.goto('/');
  await page.getByRole('textbox', { name: 'Staff Email or Identifier' }).fill(
    'admin.head-office@bunnabank.com',
  );
  await page.getByLabel('Password').fill('demo-pass');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  await page.getByRole('button', { name: /Loans Head office approvals/ }).click();

  await expect(page.getByRole('heading', { name: 'Loan Monitoring' })).toBeVisible();

  await page
    .getByRole('button', { name: new RegExp(`${targetLoan.loanId} .* ${targetLoan.memberName}`) })
    .click();

  await expect(page.getByRole('heading', { name: 'Recommended Next Action' })).toBeVisible();
  await page.getByRole('button', { name: 'Run Mark Review action' }).click();

  await expect(page.getByText('Workflow updated')).toBeVisible();
  await expect(
    page.getByText(new RegExp(`Loan ${targetLoan.loanId} was moved into active review`)),
  ).toBeVisible();

  const updatedDetailResponse = await request.get(
    `${apiBaseUrl}/loan-workflow/queue/${targetLoan.loanId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  expect(updatedDetailResponse.ok()).toBeTruthy();
  const updatedDetail = (await updatedDetailResponse.json()) as {
    history: Array<{ action: string }>;
    status: string;
  };

  expect(updatedDetail.status).toBe(targetLoan.status);
  expect(updatedDetail.history.length).toBeGreaterThan(initialDetail.history.length);
  expect(updatedDetail.history[0]?.action ?? updatedDetail.history.at(-1)?.action).toBeTruthy();
  expect(updatedDetail.history.some((item) => item.action === 'review')).toBeTruthy();
});
