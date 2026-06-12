import { createHmac } from 'crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface ParsedInitData {
  user: TelegramUser;
  authDate: Date;
  raw: Record<string, string>;
}

export class InvalidInitDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInitDataError';
  }
}

const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;

export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  options: { maxAgeSeconds?: number } = {},
): ParsedInitData {
  if (!initData) throw new InvalidInitDataError('initData is empty');
  if (!botToken) throw new InvalidInitDataError('bot token is not configured');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new InvalidInitDataError('hash is missing');

  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') entries.push([key, value]);
  });
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const computedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
    throw new InvalidInitDataError('hash mismatch');
  }

  const authDateStr = params.get('auth_date');
  if (!authDateStr) throw new InvalidInitDataError('auth_date is missing');
  const authDateSec = Number(authDateStr);
  if (!Number.isFinite(authDateSec)) {
    throw new InvalidInitDataError('auth_date is invalid');
  }
  const ageSec = Math.floor(Date.now() / 1000) - authDateSec;
  const maxAge = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  if (ageSec > maxAge) {
    throw new InvalidInitDataError('initData expired');
  }

  const userJson = params.get('user');
  if (!userJson) throw new InvalidInitDataError('user payload is missing');
  let user: TelegramUser;
  try {
    user = JSON.parse(userJson) as TelegramUser;
  } catch {
    throw new InvalidInitDataError('user payload is not valid JSON');
  }
  if (!user || typeof user.id !== 'number') {
    throw new InvalidInitDataError('user.id is missing');
  }

  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    raw[key] = value;
  });

  return {
    user,
    authDate: new Date(authDateSec * 1000),
    raw,
  };
}
