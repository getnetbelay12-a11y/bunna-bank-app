import 'dotenv/config';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: string;
    fullName?: string;
  };
};

type CampaignResponse = {
  _id: string;
  category: string;
  templateType: string;
  channels: string[];
  targetType: string;
  targetIds: string[];
  messageSubject?: string;
  messageBody: string;
  status: string;
  sentAt?: string;
};

type LogResponse = Array<{
  _id?: string;
  channel: string;
  recipient: string;
  status: string;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
}>;

async function run() {
  const baseUrl = (process.env.REMINDER_API_BASE_URL ?? 'http://127.0.0.1:4000').replace(
    /\/$/,
    '',
  );
  const identifier =
    process.env.REMINDER_STAFF_IDENTIFIER ?? 'admin.head-office@bunnabank.com';
  const password = process.env.REMINDER_STAFF_PASSWORD ?? 'demo-pass';
  const forcedRecipient =
    process.env.REMINDER_TEST_RECIPIENT ?? 'write2get@gmail.com';

  console.log(`Using backend: ${baseUrl}`);
  console.log(`Logging in as: ${identifier}`);

  const health = await requestJson(`${baseUrl}/health`);
  console.log('Health:', health);

  const login = await requestJson<LoginResponse>(`${baseUrl}/auth/staff/login`, {
    method: 'POST',
    body: {
      identifier,
      password,
    },
  });

  console.log('Login success:', {
    userId: login.user.id,
    role: login.user.role,
    fullName: login.user.fullName,
  });

  const campaign = await requestJson<CampaignResponse>(
    `${baseUrl}/manager/notifications/campaigns`,
    {
      method: 'POST',
      accessToken: login.accessToken,
      body: {
        category: 'loan',
        templateType: 'loan_due_soon',
        channels: ['email'],
        targetType: 'filtered_customers',
        filters: {},
        messageSubject: 'Loan Due Soon Reminder',
        messageBody:
          'This is a reminder that your loan installment is due soon. Please review your repayment schedule.',
        demoRecipientEmail: forcedRecipient,
      },
    },
  );

  console.log('Campaign created:', {
    id: campaign._id,
    status: campaign.status,
    templateType: campaign.templateType,
  });

  const sentCampaign = await requestJson<CampaignResponse>(
    `${baseUrl}/manager/notifications/campaigns/${campaign._id}/send`,
    {
      method: 'POST',
      accessToken: login.accessToken,
    },
  );

  console.log('Campaign sent:', {
    id: sentCampaign._id,
    status: sentCampaign.status,
    sentAt: sentCampaign.sentAt,
  });

  const logs = await requestJson<LogResponse>(
    `${baseUrl}/manager/notifications/logs/${campaign._id}`,
    {
      accessToken: login.accessToken,
    },
  );

  console.log('Delivery logs:');
  for (const log of logs) {
    console.log({
      channel: log.channel,
      recipient: log.recipient,
      status: log.status,
      providerMessageId: log.providerMessageId,
      errorMessage: log.errorMessage,
      sentAt: log.sentAt,
    });
  }
}

async function requestJson<T = unknown>(
  url: string,
  options: {
    method?: 'GET' | 'POST';
    accessToken?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();
  const payload = raw ? safeJsonParse(raw) : null;

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} for ${url}\n${JSON.stringify(payload ?? raw, null, 2)}`,
    );
  }

  return payload as T;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

void run().catch((error) => {
  console.error('Reminder flow verification failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
