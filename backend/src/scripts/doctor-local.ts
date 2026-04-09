import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { URL } from 'url';

type Check = {
  label: string;
  ok: boolean;
  detail: string;
  fix?: string;
};

async function main(): Promise<void> {
  const envPath = path.resolve(__dirname, '../../.env');
  const envFromFile = fs.existsSync(envPath)
    ? parseEnvFile(fs.readFileSync(envPath, 'utf8'))
    : {};

  const env = {
    ...envFromFile,
    ...process.env,
  };

  const expectedOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173'];
  const configuredOrigins = splitCsv(env.CLIENT_APP_ORIGIN);
  const apiBaseUrl = `http://${env.HOST || '127.0.0.1'}:${env.PORT || '4000'}`;
  const checks: Check[] = [
    {
      label: '.env file exists',
      ok: fs.existsSync(envPath),
      detail: envPath,
      fix: 'cp .env.example .env',
    },
    {
      label: 'MONGODB_URI uses MongoDB Atlas',
      ok: typeof env.MONGODB_URI === 'string' && env.MONGODB_URI.startsWith('mongodb+srv://'),
      detail: env.MONGODB_URI || 'missing',
      fix: 'set MONGODB_URI=mongodb+srv://... in backend/.env',
    },
    {
      label: 'HOST is set for local access',
      ok: env.HOST === '0.0.0.0' || env.HOST === '127.0.0.1' || env.HOST === 'localhost',
      detail: env.HOST || 'missing',
      fix: 'set HOST=0.0.0.0 in backend/.env',
    },
    {
      label: 'PORT is configured',
      ok: typeof env.PORT === 'string' && env.PORT.length > 0,
      detail: env.PORT || 'missing',
      fix: 'set PORT=4000 in backend/.env',
    },
    {
      label: 'CLIENT_APP_ORIGIN allows the local admin console',
      ok: expectedOrigins.every((origin) => configuredOrigins.includes(origin)),
      detail: env.CLIENT_APP_ORIGIN || 'missing',
      fix: 'set CLIENT_APP_ORIGIN=http://127.0.0.1:5173,http://localhost:5173 in backend/.env',
    },
    {
      label: 'EMAIL_PROVIDER is configured for local reminder sending',
      ok: typeof env.EMAIL_PROVIDER === 'string' && env.EMAIL_PROVIDER.length > 0,
      detail: env.EMAIL_PROVIDER || 'missing',
      fix: 'set EMAIL_PROVIDER=log in backend/.env',
    },
    {
      label: 'EMAIL_FORCE_TEST_RECIPIENT is configured',
      ok:
        typeof env.EMAIL_FORCE_TEST_RECIPIENT === 'string' &&
        env.EMAIL_FORCE_TEST_RECIPIENT.includes('@'),
      detail: env.EMAIL_FORCE_TEST_RECIPIENT || 'missing',
      fix: 'set EMAIL_FORCE_TEST_RECIPIENT=write2get@gmail.com in backend/.env',
    },
    {
      label: 'DEMO_MODE is enabled for seeded local auth',
      ok: String(env.DEMO_MODE || '').toLowerCase() === 'true',
      detail: env.DEMO_MODE || 'missing',
      fix: 'set DEMO_MODE=true in backend/.env',
    },
  ];

  for (const check of checks) {
    console.log(`${check.ok ? 'OK' : 'WARN'}  ${check.label} (${check.detail})`);
  }

  const health = await fetchHealth(apiBaseUrl);
  console.log(`${health.ok ? 'OK' : 'WARN'}  backend health (${health.detail})`);

  if (checks.every((check) => check.ok) && health.ok) {
    console.log('');
    console.log('Backend reminder flow looks ready.');
    return;
  }

  console.log('');
  console.log('Doctor found issues. Recommended next steps:');
  for (const check of checks) {
    if (!check.ok && check.fix) {
      console.log(`  ${check.fix}`);
    }
  }
  if (!health.ok) {
    console.log('  npm run start:dev');
  }
}

async function fetchHealth(apiBaseUrl: string): Promise<Check> {
  try {
    const healthUrl = new URL('/health', apiBaseUrl).toString();
    const response = await fetch(healthUrl);
    if (!response.ok) {
      return {
        label: 'backend health',
        ok: false,
        detail: `HTTP ${response.status}`,
      };
    }

    const payload = (await response.json()) as { status?: string; port?: number | string };
    return {
      label: 'backend health',
      ok: payload?.status === 'ok',
      detail: JSON.stringify(payload),
    };
  } catch (error) {
    return {
      label: 'backend health',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseEnvFile(content: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

function splitCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

void main();
