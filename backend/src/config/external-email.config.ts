import { existsSync, readFileSync } from 'fs';

const DEFAULT_INSURANCE_BACKEND_ENV_PATH =
  '/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/.env';

type ExternalEmailSettings = {
  provider: string;
  sender: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  sourcePath?: string;
};

let cachedSettings: ExternalEmailSettings | null | undefined;

function parseEnvFile(filePath: string) {
  const content = readFileSync(filePath, 'utf8');
  const values: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }

  return values;
}

export function getExternalEmailSettings(): ExternalEmailSettings | null {
  if (cachedSettings !== undefined) {
    return cachedSettings;
  }

  const envPath =
    process.env.INSURANCE_BACKEND_ENV_PATH?.trim() ||
    DEFAULT_INSURANCE_BACKEND_ENV_PATH;

  if (!existsSync(envPath)) {
    cachedSettings = null;
    return cachedSettings;
  }

  const values = parseEnvFile(envPath);
  cachedSettings = {
    provider: values.EMAIL_PROVIDER ?? 'log',
    sender: values.EMAIL_SENDER ?? '',
    smtpHost: values.EMAIL_SMTP_HOST ?? values.MAIL_HOST ?? '',
    smtpPort: Number(values.EMAIL_SMTP_PORT ?? values.MAIL_PORT ?? 587),
    smtpSecure:
      (values.EMAIL_SMTP_SECURE ?? values.MAIL_SECURE ?? 'false') === 'true',
    smtpUser: values.EMAIL_SMTP_USER ?? values.MAIL_USER ?? '',
    smtpPass: values.EMAIL_SMTP_PASS ?? values.MAIL_PASSWORD ?? '',
    sourcePath: envPath,
  };

  return cachedSettings;
}

export { DEFAULT_INSURANCE_BACKEND_ENV_PATH };
