type EnvironmentRecord = Record<string, unknown>;

const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);
const VALID_NOTIFICATION_PROVIDERS = new Set(['log', 'firebase', 'generic_http']);
const VALID_EMAIL_PROVIDERS = new Set(['log', 'smtp', 'generic_http']);
const VALID_STORAGE_PROVIDERS = new Set(['local', 's3']);
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/cbe_bank_app';
const LEGACY_DATABASE_NAME = 'amhara_bank_app';
const CURRENT_DATABASE_NAME = 'cbe_bank_app';

export function parseAllowedOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

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

function requireNonEmptyWhenEnabled(
  enabled: boolean,
  provider: string,
  key: string,
  value: string,
  { providers }: { providers?: string[] } = {},
) {
  if (!enabled) {
    return;
  }

  if (providers && !providers.includes(provider)) {
    return;
  }

  if (!value) {
    throw new Error(`Environment variable ${key} is required for ${provider}.`);
  }
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
      'MONGODB_URI must include a database name. Expected /cbe_bank_app.',
    );
  }

  if (databaseName !== CURRENT_DATABASE_NAME) {
    throw new Error(
      `MONGODB_URI must target the cbe_bank_app database. Received ${databaseName}.`,
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
  const awsRegion = readString(config, 'AWS_REGION');
  const awsS3Bucket = readString(config, 'AWS_S3_BUCKET');
  const smsEnabled = readBoolean(config, 'SMS_ENABLED', true);
  const smsProvider = requireEnumValue(
    'SMS_PROVIDER',
    readString(config, 'SMS_PROVIDER', 'log'),
    VALID_NOTIFICATION_PROVIDERS,
  );
  const smsGenericEndpoint = readString(config, 'SMS_GENERIC_ENDPOINT');
  const smsGenericApiKey = readString(config, 'SMS_GENERIC_API_KEY');
  const emailEnabled = readBoolean(config, 'EMAIL_ENABLED', true);
  const emailProvider = requireEnumValue(
    'EMAIL_PROVIDER',
    readString(config, 'EMAIL_PROVIDER', 'log'),
    VALID_EMAIL_PROVIDERS,
  );
  const emailSender = readString(
    config,
    'EMAIL_SENDER',
    'notifications@bunna-bank.local',
  );
  const emailGenericEndpoint = readString(config, 'EMAIL_GENERIC_ENDPOINT');
  const emailGenericApiKey = readString(config, 'EMAIL_GENERIC_API_KEY');
  const emailSmtpHost = readString(config, 'EMAIL_SMTP_HOST');
  const emailSmtpPort = readNumber(config, 'EMAIL_SMTP_PORT', 587, { min: 1 });
  const emailSmtpSecure = readBoolean(config, 'EMAIL_SMTP_SECURE', false);
  const emailSmtpUser = readString(config, 'EMAIL_SMTP_USER');
  const emailSmtpPass = readString(config, 'EMAIL_SMTP_PASS');
  const pushEnabled = readBoolean(config, 'PUSH_ENABLED', true);
  const pushProvider = requireEnumValue(
    'PUSH_PROVIDER',
    readString(config, 'PUSH_PROVIDER', 'log'),
    VALID_NOTIFICATION_PROVIDERS,
  );
  const pushGenericEndpoint = readString(config, 'PUSH_GENERIC_ENDPOINT');
  const pushGenericApiKey = readString(config, 'PUSH_GENERIC_API_KEY');
  const firebaseProjectId = readString(config, 'FIREBASE_PROJECT_ID');
  const firebasePrivateKey = readString(config, 'FIREBASE_PRIVATE_KEY');
  const firebaseClientEmail = readString(config, 'FIREBASE_CLIENT_EMAIL');
  const demoMode = readBoolean(config, 'DEMO_MODE', false);
  const clientAppOrigin = readString(config, 'CLIENT_APP_ORIGIN', '*');
  const allowedOrigins = parseAllowedOrigins(clientAppOrigin);

  if (nodeEnv === 'production' && allowedOrigins.includes('*')) {
    throw new Error(
      'CLIENT_APP_ORIGIN cannot use * in production. Set one or more explicit origins.',
    );
  }

  if (storageProvider === 's3') {
    if (!awsRegion || !awsS3Bucket) {
      throw new Error(
        'AWS_REGION and AWS_S3_BUCKET are required when STORAGE_PROVIDER=s3.',
      );
    }

    if (nodeEnv === 'production') {
      throw new Error(
        'STORAGE_PROVIDER=s3 is not production-ready in this repo yet. Use local storage or implement the S3 upload client first.',
      );
    }
  }

  requireNonEmptyWhenEnabled(
    smsEnabled,
    smsProvider,
    'SMS_GENERIC_ENDPOINT',
    smsGenericEndpoint,
    { providers: ['generic_http'] },
  );
  requireNonEmptyWhenEnabled(
    emailEnabled,
    emailProvider,
    'EMAIL_GENERIC_ENDPOINT',
    emailGenericEndpoint,
    { providers: ['generic_http'] },
  );
  requireNonEmptyWhenEnabled(
    pushEnabled,
    pushProvider,
    'PUSH_GENERIC_ENDPOINT',
    pushGenericEndpoint,
    { providers: ['generic_http'] },
  );
  requireNonEmptyWhenEnabled(
    emailEnabled,
    emailProvider,
    'EMAIL_SMTP_HOST',
    emailSmtpHost,
    { providers: ['smtp'] },
  );
  requireNonEmptyWhenEnabled(
    emailEnabled,
    emailProvider,
    'EMAIL_SMTP_USER',
    emailSmtpUser,
    { providers: ['smtp'] },
  );
  requireNonEmptyWhenEnabled(
    emailEnabled,
    emailProvider,
    'EMAIL_SMTP_PASS',
    emailSmtpPass,
    { providers: ['smtp'] },
  );
  requireNonEmptyWhenEnabled(
    emailEnabled,
    emailProvider,
    'EMAIL_SENDER',
    emailSender,
    { providers: ['smtp'] },
  );
  requireNonEmptyWhenEnabled(
    pushEnabled,
    pushProvider,
    'FIREBASE_PROJECT_ID',
    firebaseProjectId,
    { providers: ['firebase'] },
  );
  requireNonEmptyWhenEnabled(
    pushEnabled,
    pushProvider,
    'FIREBASE_CLIENT_EMAIL',
    firebaseClientEmail,
    { providers: ['firebase'] },
  );
  requireNonEmptyWhenEnabled(
    pushEnabled,
    pushProvider,
    'FIREBASE_PRIVATE_KEY',
    firebasePrivateKey,
    { providers: ['firebase'] },
  );

  if (nodeEnv === 'production' && pushEnabled && pushProvider === 'firebase') {
    throw new Error(
      'PUSH_PROVIDER=firebase is not production-ready in this repo yet. Use log/generic_http or implement Firebase delivery first.',
    );
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    DEMO_MODE: demoMode,
    APP_NAME: readString(config, 'APP_NAME', 'Bunna Bank API'),
    APP_LOG_LEVEL: readString(config, 'APP_LOG_LEVEL', 'log'),
    CLIENT_APP_ORIGIN: clientAppOrigin,
    APP_TRUST_PROXY: readBoolean(config, 'APP_TRUST_PROXY', nodeEnv === 'production'),
    MONGODB_URI: mongodbUri,
    MONGODB_DATABASE_NAME: mongoConnection.databaseName,
    MONGODB_HOST: mongoConnection.host,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: readString(config, 'JWT_EXPIRES_IN', '1d'),
    JWT_REFRESH_EXPIRES_IN: readString(config, 'JWT_REFRESH_EXPIRES_IN', '7d'),
    FIREBASE_PROJECT_ID: firebaseProjectId,
    FIREBASE_PRIVATE_KEY: firebasePrivateKey,
    FIREBASE_CLIENT_EMAIL: firebaseClientEmail,
    SMS_ENABLED: smsEnabled,
    SMS_PROVIDER: smsProvider,
    SMS_SENDER_ID: readString(config, 'SMS_SENDER_ID', 'BUNNA_BANK'),
    SMS_GENERIC_ENDPOINT: smsGenericEndpoint,
    SMS_GENERIC_API_KEY: smsGenericApiKey,
    EMAIL_ENABLED: emailEnabled,
    EMAIL_PROVIDER: emailProvider,
    EMAIL_SENDER: emailSender,
    EMAIL_GENERIC_ENDPOINT: emailGenericEndpoint,
    EMAIL_GENERIC_API_KEY: emailGenericApiKey,
    EMAIL_SMTP_HOST: emailSmtpHost,
    EMAIL_SMTP_PORT: emailSmtpPort,
    EMAIL_SMTP_SECURE: emailSmtpSecure,
    EMAIL_SMTP_USER: emailSmtpUser,
    EMAIL_SMTP_PASS: emailSmtpPass,
    PUSH_ENABLED: pushEnabled,
    PUSH_PROVIDER: pushProvider,
    PUSH_GENERIC_ENDPOINT: pushGenericEndpoint,
    PUSH_GENERIC_API_KEY: pushGenericApiKey,
    FILE_UPLOAD_PATH: readString(config, 'FILE_UPLOAD_PATH', 'uploads/'),
    STORAGE_PROVIDER: storageProvider,
    AWS_REGION: awsRegion,
    AWS_S3_BUCKET: awsS3Bucket,
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
