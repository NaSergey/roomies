import { hashPassword, needsRehash, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies a password against its own hash', () => {
    const hash = hashPassword('correct horse battery staple');
    expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects a wrong password', () => {
    const hash = hashPassword('correct horse battery staple');
    expect(verifyPassword('Correct horse battery staple', hash)).toBe(false);
    expect(verifyPassword('', hash)).toBe(false);
  });

  it('produces a different hash each time (random salt)', () => {
    expect(hashPassword('same-password')).not.toBe(hashPassword('same-password'));
  });

  it('embeds the scrypt parameters in the hash', () => {
    const [prefix, n, r, p] = hashPassword('x').split('$');
    expect(prefix).toBe('scrypt');
    expect(Number(n)).toBeGreaterThanOrEqual(32768);
    expect(Number(r)).toBeGreaterThanOrEqual(8);
    expect(Number(p)).toBeGreaterThanOrEqual(1);
  });

  it('still verifies legacy `salt:hash` hashes (pre-parameterised format)', () => {
    // Воспроизводим старый формат: дефолтные параметры scrypt, разделитель ':'.
    const { randomBytes, scryptSync } = require('crypto') as typeof import('crypto');
    const salt = randomBytes(16).toString('hex');
    const legacy = `${salt}:${scryptSync('legacy-pass', salt, 64).toString('hex')}`;

    expect(verifyPassword('legacy-pass', legacy)).toBe(true);
    expect(verifyPassword('wrong', legacy)).toBe(false);
  });

  it('flags legacy hashes for rehash and current ones as fine', () => {
    const { randomBytes, scryptSync } = require('crypto') as typeof import('crypto');
    const salt = randomBytes(16).toString('hex');
    const legacy = `${salt}:${scryptSync('p', salt, 64).toString('hex')}`;

    expect(needsRehash(legacy)).toBe(true);
    expect(needsRehash(hashPassword('p'))).toBe(false);
  });

  it('rejects malformed or empty stored hashes without throwing', () => {
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', 'garbage')).toBe(false);
    expect(verifyPassword('x', 'scrypt$$$$$')).toBe(false);
    expect(verifyPassword('x', 'scrypt$0$0$0$salt$abcd')).toBe(false);
    expect(verifyPassword('x', 'salt:')).toBe(false);
  });
});
