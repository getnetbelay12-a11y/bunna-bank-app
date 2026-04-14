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

test('head office admin can assign and reply to a live support conversation', async ({
  page,
  request,
}) => {
  const { accessToken } = await loginAsAdmin(request);

  const openChatsResponse = await request.get(`${apiBaseUrl}/support/console/chats/open`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  expect(openChatsResponse.ok()).toBeTruthy();
  const openChats = (await openChatsResponse.json()) as Array<{
    conversationId: string;
    memberName?: string;
  }>;
  const targetChat = openChats[0];
  expect(targetChat).toBeTruthy();

  const replyMessage = `Playwright support reply ${Date.now()}`;

  await page.goto('/');
  await page.getByRole('textbox', { name: 'Staff Email or Identifier' }).fill(
    'admin.head-office@bunnabank.com',
  );
  await page.getByLabel('Password').fill('demo-pass');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  await page.getByRole('button', { name: /Support Institution-wide support/ }).click();

  await expect(page.getByRole('heading', { name: 'Support Chat Inbox' })).toBeVisible();

  await page
    .getByRole('button', {
      name: new RegExp(targetChat.memberName ?? targetChat.conversationId),
    })
    .first()
    .click();

  await expect(
    page.getByRole('heading', {
      name: targetChat.memberName ?? targetChat.conversationId,
    }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Assign To Me' }).click();
  await expect(page.getByText('Lulit Mekonnen')).toBeVisible();

  await page.getByPlaceholder('Type your reply to the customer').fill(replyMessage);
  await page.getByRole('button', { name: 'Send Reply' }).click();

  await expect(page.getByText(replyMessage)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Reply' })).toBeVisible();

  await expect
    .poll(async () => {
      const detailResponse = await request.get(
        `${apiBaseUrl}/support/console/chats/${targetChat.conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!detailResponse.ok()) {
        return 'request_failed';
      }

      const detail = (await detailResponse.json()) as {
        assignedToStaffName?: string;
        messages: Array<{ message: string }>;
      };

      return JSON.stringify({
        assignedToStaffName: detail.assignedToStaffName,
        hasReply: detail.messages.some((item) => item.message === replyMessage),
      });
    })
    .toBe(
      JSON.stringify({
        assignedToStaffName: 'Lulit Mekonnen',
        hasReply: true,
      }),
    );
});
