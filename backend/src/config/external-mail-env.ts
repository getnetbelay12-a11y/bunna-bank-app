import { existsSync, readFileSync } from 'fs';

const DEFAULT_EXTERNAL_MAIL_ENV_FILE =
  '/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/.env';

const REUSED_MAIL_KEYS = [
  'EMAIL_ENABLED',
  'EMAIL_PROVIDER',
  'EMAIL_SENDER',
  'EMAIL_SMTP_HOST',
  'EMAIL_SMTP_PORT',
  'EMAIL_SMTP_SECURE',
  'EMAIL_SMTP_USER',
  'EMAIL_SMTP_PASS',
];

function parseEnvFile(filePath: string) {
  const parsed: Record<string, string> = {};
  const content = readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

export function loadExternalMailEnvironment() {
  if ((process.env.BUNNA_LOAD_INSURANCE_MAIL_ENV ?? 'true') !== 'true') {
    return;
  }

  const envFilePath =
    process.env.BUNNA_INSURANCE_MAIL_ENV_FILE ?? DEFAULT_EXTERNAL_MAIL_ENV_FILE;

  if (!existsSync(envFilePath)) {
    return;
  }

  const externalValues = parseEnvFile(envFilePath);

  for (const key of REUSED_MAIL_KEYS) {
    if (!process.env[key] && externalValues[key]) {
      process.env[key] = externalValues[key];
    }
  }
}
