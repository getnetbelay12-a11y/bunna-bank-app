import { existsSync, readFileSync } from 'fs';

export const DEFAULT_TELEGRAM_ENV_PATH = '';

type ExternalTelegramSettings = {
  botToken: string;
  apiBase: string;
  forceTestChatId: string;
  sourcePath?: string;
};

let cachedSettings: ExternalTelegramSettings | null | undefined;

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

export function getExternalTelegramSettings(): ExternalTelegramSettings | null {
  if (cachedSettings !== undefined) {
    return cachedSettings;
  }

  const envPath =
    process.env.EXTERNAL_TELEGRAM_ENV_PATH?.trim() || DEFAULT_TELEGRAM_ENV_PATH;

  if (!existsSync(envPath)) {
    cachedSettings = null;
    return cachedSettings;
  }

  const values = parseEnvFile(envPath);
  cachedSettings = {
    botToken: values.TELEGRAM_BOT_TOKEN ?? '',
    apiBase: values.TELEGRAM_BOT_API_BASE ?? 'https://api.telegram.org',
    forceTestChatId: values.TELEGRAM_FORCE_TEST_CHAT_ID ?? '',
    sourcePath: envPath,
  };

  return cachedSettings;
}
