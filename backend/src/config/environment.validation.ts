type EnvironmentRecord = Record<string, unknown>;

const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);
const VALID_NOTIFICATION_PROVIDERS = new Set([
  'log',
  'firebase',
  'generic_http',
  'ios_simulator',
  'apns',
]);
const VALID_EMAIL_PROVIDERS = new Set(['log', 'smtp', 'generic_http']);
const VALID_STORAGE_PROVIDERS = new Set(['local', 's3']);
const CURRENT_DATABASE_NAME = 'bunna_bank_app';
const DEFAULT_MONGODB_URI = `mongodb://localhost:27017/${CURRENT_DATABASE_NAME}`;
const LEGACY_DATABASE_NAME = CURRENT_DATABASE_NAME;

export function normalizeMongoUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed.includes(`/${LEGACY_DATABASE_NAME}`)) {
    return trimmed;
  }

  return trimmed.replace(
    new RegExp(`/${LEGACY_DATABASE_NAME}(?=\\?|$)`),
    `/${CURRENT_DATABASE_NAME}`,
  );
}

function readString(
  config: EnvironmentRecord,
  key: string,
  defaultValue = '',
): string {
  const value = config[key];
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value == null) {
    return defaultValue;
  }

  return String(value).trim();
}

function readNumber(
  config: EnvironmentRecord,
  key: string,
  defaultValue: number,
  { min }: { min?: number } = {},
): number {
  const raw = readString(config, key, String(defaultValue));
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number.`);
  }

  if (min != null && parsed < min) {
    throw new Error(`Environment variable ${key} must be >= ${min}.`);
  }

  return parsed;
}

function readBoolean(
  config: EnvironmentRecord,
  key: string,
  defaultValue: boolean,
): boolean {
  const raw = readString(config, key, defaultValue ? 'true' : 'false').toLowerCase();

  if (raw === 'true') {
    return true;
  }

  if (raw === 'false') {
    return false;
  }

  throw new Error(`Environment variable ${key} must be true or false.`);
}

function requireSecret(
  config: EnvironmentRecord,
  key: string,
  minimumLength: number,
): string {
  const value = readString(config, key);

  if (value.length < minimumLength) {
    throw new Error(
      `Environment variable ${key} must be at least ${minimumLength} characters.`,
    );
  }

  return value;
}

function requireEnumValue(
  key: string,
  value: string,
  validValues: Set<string>,
): string {
  if (!validValues.has(value)) {
    throw new Error(
      `Environment variable ${key} must be one of: ${Array.from(validValues).join(', ')}.`,
    );
  }

  return value;
}

export function parseMongoConnectionDetails(uri: string): {
  databaseName: string;
  host: string;
} {
  const trimmed = normalizeMongoUri(uri);
  let url: URL | null = null;

  try {
    if (trimmed.startsWith('mongodb+srv://')) {
      url = new URL(trimmed.replace('mongodb+srv://', 'https://'));
    } else if (trimmed.startsWith('mongodb://')) {
      url = new URL(trimmed.replace('mongodb://', 'http://'));
    }
  } catch {
    url = null;
  }

  const pathname = url?.pathname ?? '';
  const databaseName = pathname.replace(/^\//, '').split('?')[0] || '';

  if (!databaseName) {
    throw new Error(
      `MONGODB_URI must include a database name. Expected /${CURRENT_DATABASE_NAME}.`,
    );
  }

  if (databaseName !== CURRENT_DATABASE_NAME) {
    throw new Error(
      `MONGODB_URI must target the ${CURRENT_DATABASE_NAME} database. Received ${databaseName}.`,
    );
  }

  return {
    databaseName,
    host: url?.host || 'localhost',
  };
}

export function validateEnvironment(config: EnvironmentRecord): EnvironmentRecord {
  const nodeEnv = readString(config, 'NODE_ENV', 'development');
  if (!VALID_NODE_ENVS.has(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }

  const port = readNumber(config, 'PORT', 4000, { min: 1 });
  const mongodbUri = normalizeMongoUri(
    readString(config, 'MONGODB_URI', DEFAULT_MONGODB_URI),
  );
  const mongoConnection = parseMongoConnectionDetails(mongodbUri);
  const jwtSecret = requireSecret(config, 'JWT_SECRET', 16);
  const otpSigningSecret = requireSecret(config, 'OTP_SIGNING_SECRET', 16);
  const storageProvider = requireEnumValue(
    'STORAGE_PROVIDER',
    readString(config, 'STORAGE_PROVIDER', 'local'),
    VALID_STORAGE_PROVIDERS,
  );
  const demoMode = readBoolean(config, 'DEMO_MODE', false);

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    DEMO_MODE: demoMode,
    APP_NAME: readString(config, 'APP_NAME', 'Bunna Bank API'),
    APP_LOG_LEVEL: readString(config, 'APP_LOG_LEVEL', 'log'),
    CLIENT_APP_ORIGIN: readString(config, 'CLIENT_APP_ORIGIN', '*'),
    MONGODB_URI: mongodbUri,
    MONGODB_DATABASE_NAME: mongoConnection.databaseName,
    MONGODB_HOST: mongoConnection.host,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: readString(config, 'JWT_EXPIRES_IN', '1d'),
    JWT_REFRESH_EXPIRES_IN: readString(config, 'JWT_REFRESH_EXPIRES_IN', '7d'),
    FIREBASE_PROJECT_ID: readString(config, 'FIREBASE_PROJECT_ID'),
    FIREBASE_PRIVATE_KEY: readString(config, 'FIREBASE_PRIVATE_KEY'),
    FIREBASE_CLIENT_EMAIL: readString(config, 'FIREBASE_CLIENT_EMAIL'),
    SMS_ENABLED: readBoolean(config, 'SMS_ENABLED', true),
    SMS_PROVIDER: requireEnumValue(
      'SMS_PROVIDER',
      readString(config, 'SMS_PROVIDER', 'log'),
      VALID_NOTIFICATION_PROVIDERS,
    ),
    SMS_SENDER_ID: readString(config, 'SMS_SENDER_ID', 'BUNNA_BANK'),
    SMS_GENERIC_ENDPOINT: readString(config, 'SMS_GENERIC_ENDPOINT'),
    SMS_GENERIC_API_KEY: readString(config, 'SMS_GENERIC_API_KEY'),
    EMAIL_ENABLED: readBoolean(config, 'EMAIL_ENABLED', true),
    EMAIL_PROVIDER: requireEnumValue(
      'EMAIL_PROVIDER',
      readString(config, 'EMAIL_PROVIDER', 'log'),
      VALID_EMAIL_PROVIDERS,
    ),
    EMAIL_SENDER: readString(config, 'EMAIL_SENDER', 'notifications@bunna-bank.local'),
    EMAIL_GENERIC_ENDPOINT: readString(config, 'EMAIL_GENERIC_ENDPOINT'),
    EMAIL_GENERIC_API_KEY: readString(config, 'EMAIL_GENERIC_API_KEY'),
    EMAIL_SMTP_HOST: readString(config, 'EMAIL_SMTP_HOST'),
    EMAIL_SMTP_PORT: readNumber(config, 'EMAIL_SMTP_PORT', 587, { min: 1 }),
    EMAIL_SMTP_SECURE: readBoolean(config, 'EMAIL_SMTP_SECURE', false),
    EMAIL_SMTP_USER: readString(config, 'EMAIL_SMTP_USER'),
    EMAIL_SMTP_PASS: readString(config, 'EMAIL_SMTP_PASS'),
    PUSH_ENABLED: readBoolean(config, 'PUSH_ENABLED', true),
    PUSH_PROVIDER: requireEnumValue(
      'PUSH_PROVIDER',
      readString(config, 'PUSH_PROVIDER', 'log'),
      VALID_NOTIFICATION_PROVIDERS,
    ),
    PUSH_GENERIC_ENDPOINT: readString(config, 'PUSH_GENERIC_ENDPOINT'),
    PUSH_GENERIC_API_KEY: readString(config, 'PUSH_GENERIC_API_KEY'),
    PUSH_IOS_SIMULATOR_DEVICE: readString(config, 'PUSH_IOS_SIMULATOR_DEVICE', 'booted'),
    PUSH_IOS_SIMULATOR_BUNDLE_ID: readString(
      config,
      'PUSH_IOS_SIMULATOR_BUNDLE_ID',
      'com.getnetbelay.bunnaBankMobile',
    ),
    APNS_TEAM_ID: readString(config, 'APNS_TEAM_ID'),
    APNS_KEY_ID: readString(config, 'APNS_KEY_ID'),
    APNS_BUNDLE_ID: readString(
      config,
      'APNS_BUNDLE_ID',
      'com.getnetbelay.bunnaBankMobile',
    ),
    APNS_PRIVATE_KEY: readString(config, 'APNS_PRIVATE_KEY'),
    APNS_USE_SANDBOX: readBoolean(config, 'APNS_USE_SANDBOX', true),
    FILE_UPLOAD_PATH: readString(config, 'FILE_UPLOAD_PATH', 'uploads/'),
    STORAGE_PROVIDER: storageProvider,
    AWS_REGION: readString(config, 'AWS_REGION'),
    AWS_S3_BUCKET: readString(config, 'AWS_S3_BUCKET'),
    OTP_ENABLED: readBoolean(config, 'OTP_ENABLED', true),
    OTP_TTL_MINUTES: readNumber(config, 'OTP_TTL_MINUTES', 5, { min: 1 }),
    OTP_MAX_ATTEMPTS: readNumber(config, 'OTP_MAX_ATTEMPTS', 5, { min: 1 }),
    OTP_RESEND_COOLDOWN_SECONDS: readNumber(
      config,
      'OTP_RESEND_COOLDOWN_SECONDS',
      30,
      { min: 0 },
    ),
    OTP_SIGNING_SECRET: otpSigningSecret,
  };
}

export { DEFAULT_MONGODB_URI };
