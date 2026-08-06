import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Параметры scrypt. N=2^15, r=8, p=1 — ~32 MiB памяти и ~50–100 мс на хеш:
// достаточно дорого для офлайн-перебора и приемлемо при rate-limit на /auth/login.
// maxmem поднят, потому что дефолт Node (32 MiB) ровно на границе и падает с ENOMEM.
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

// Формат: scrypt$N$r$p$salt$hash — параметры хранятся ВНУТРИ хеша, поэтому их
// можно поднять позже, не ломая уже сохранённые пароли (см. needsRehash).
const PREFIX = 'scrypt';

// scrypt из node:crypto — без внешних зависимостей (bcrypt требует нативную сборку,
// что на Windows-машинах разработчиков лишняя головная боль).
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const hash = derive(plain, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P).toString('hex');
  return `${PREFIX}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parsed = parse(stored);
  if (!parsed) return false;

  const { salt, hash, n, r, p } = parsed;
  const expected = Buffer.from(hash, 'hex');
  if (expected.length === 0) return false;

  let candidate: Buffer;
  try {
    candidate = derive(plain, salt, n, r, p, expected.length);
  } catch {
    // Битые/подозрительные параметры в хеше — не роняем запрос, просто отказ.
    return false;
  }
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// true — хеш сохранён в старом формате или со слабыми параметрами; после успешного
// входа его стоит перезаписать актуальным hashPassword (см. AuthService.loginWithEmail).
export function needsRehash(stored: string): boolean {
  const parsed = parse(stored);
  if (!parsed) return true;
  return (
    parsed.legacy ||
    parsed.n < SCRYPT_N ||
    parsed.r < SCRYPT_R ||
    parsed.p < SCRYPT_P
  );
}

interface ParsedHash {
  salt: string;
  hash: string;
  n: number;
  r: number;
  p: number;
  legacy: boolean;
}

function parse(stored: string): ParsedHash | null {
  if (!stored) return null;

  if (stored.startsWith(`${PREFIX}$`)) {
    const [, nRaw, rRaw, pRaw, salt, hash] = stored.split('$');
    const n = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);
    if (!salt || !hash) return null;
    if (!isPositiveInt(n) || !isPositiveInt(r) || !isPositiveInt(p)) return null;
    return { salt, hash, n, r, p, legacy: false };
  }

  // Legacy-формат `salt:hash` с дефолтными параметрами scrypt (N=16384, r=8, p=1).
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return null;
  return { salt, hash, n: 16384, r: 8, p: 1, legacy: true };
}

function isPositiveInt(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

function derive(
  plain: string,
  salt: string,
  n: number,
  r: number,
  p: number,
  keyLength: number = KEY_LENGTH,
): Buffer {
  return scryptSync(plain, salt, keyLength, {
    N: n,
    r,
    p,
    maxmem: SCRYPT_MAXMEM,
  });
}
