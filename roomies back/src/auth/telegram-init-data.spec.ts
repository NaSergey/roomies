import { createHmac } from 'crypto';
import {
  InvalidInitDataError,
  verifyTelegramInitData,
} from './telegram-init-data';

const BOT_TOKEN = 'test-bot-token';

// Собирает валидную подписанную initData ровно так, как это делает Telegram
// WebApp SDK на клиенте — воспроизводим data_check_string и HMAC вручную,
// а не зовём verifyTelegramInitData «задом наперёд».
function buildInitData(
  overrides: Record<string, string> = {},
  authDate = Math.floor(Date.now() / 1000),
): string {
  const fields: Record<string, string> = {
    user: JSON.stringify({ id: 42, first_name: 'Тест', username: 'test_user' }),
    auth_date: String(authDate),
    query_id: 'AAA123',
    ...overrides,
  };

  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const params = new URLSearchParams({ ...fields, hash });
  return params.toString();
}

describe('verifyTelegramInitData', () => {
  it('accepts correctly signed initData and parses the user', () => {
    const initData = buildInitData();
    const result = verifyTelegramInitData(initData, BOT_TOKEN);
    expect(result.user.id).toBe(42);
    expect(result.user.username).toBe('test_user');
  });

  it('rejects a tampered payload (hash no longer matches)', () => {
    const initData = buildInitData({ query_id: 'AAA123' }).replace(
      'AAA123',
      'HACKED',
    );
    expect(() => verifyTelegramInitData(initData, BOT_TOKEN)).toThrow(
      InvalidInitDataError,
    );
  });

  it('rejects a hash signed with the wrong bot token', () => {
    const initData = buildInitData();
    expect(() =>
      verifyTelegramInitData(initData, 'a-different-bot-token'),
    ).toThrow(InvalidInitDataError);
  });

  it('rejects expired initData (auth_date older than the max age)', () => {
    const eightyHoursAgo = Math.floor(Date.now() / 1000) - 80 * 60 * 60;
    const initData = buildInitData({}, eightyHoursAgo);
    expect(() => verifyTelegramInitData(initData, BOT_TOKEN)).toThrow(
      InvalidInitDataError,
    );
  });

  it('rejects a malformed/short hash without throwing an unexpected error', () => {
    // Не hex, не той длины — Buffer.from(..., 'hex') должен молча обрезаться
    // до другой длины, а не свалить сравнение в исключение из timingSafeEqual.
    const initData = buildInitData().replace(/hash=[0-9a-f]+/, 'hash=zz');
    expect(() => verifyTelegramInitData(initData, BOT_TOKEN)).toThrow(
      InvalidInitDataError,
    );
  });

  it('rejects missing hash, missing user, and empty input', () => {
    expect(() => verifyTelegramInitData('', BOT_TOKEN)).toThrow(
      InvalidInitDataError,
    );
    expect(() => verifyTelegramInitData('auth_date=1', BOT_TOKEN)).toThrow(
      InvalidInitDataError,
    );
    expect(() =>
      verifyTelegramInitData('a=b&hash=deadbeef', BOT_TOKEN),
    ).toThrow(InvalidInitDataError);
  });
});
