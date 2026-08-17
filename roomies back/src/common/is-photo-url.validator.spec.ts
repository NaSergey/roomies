import { isPhotoUrl } from './is-photo-url.validator';

describe('isPhotoUrl', () => {
  it('принимает относительный путь нашей загрузки', () => {
    // Ровно то, что возвращает POST /profile/photo — раньше падало на @IsUrl.
    expect(isPhotoUrl('/uploads/7324-2f1a6c4e-1111-4222-8333-abcdefabcdef.jpg')).toBe(true);
  });

  it('принимает внешние http(s)-ссылки', () => {
    expect(isPhotoUrl('https://t.me/i/userpic/320/abc.jpg')).toBe(true);
    expect(isPhotoUrl('https://i.pravatar.cc/500?img=33')).toBe(true);
    expect(isPhotoUrl('http://localhost:4000/uploads/x.jpg')).toBe(true);
  });

  it('отклоняет протоколы, которым нечего делать в src картинки', () => {
    expect(isPhotoUrl('javascript:alert(1)')).toBe(false);
    expect(isPhotoUrl('data:image/svg+xml,<svg onload="alert(1)"/>')).toBe(false);
    expect(isPhotoUrl('blob:https://example.com/abc')).toBe(false);
  });

  it('отклоняет произвольные строки и обход каталога', () => {
    expect(isPhotoUrl('не ссылка')).toBe(false);
    expect(isPhotoUrl('/uploads/../../etc/passwd')).toBe(false);
    expect(isPhotoUrl('/etc/passwd')).toBe(false);
    expect(isPhotoUrl('')).toBe(false);
  });

  it('отклоняет не-строки и слишком длинные значения', () => {
    expect(isPhotoUrl(null)).toBe(false);
    expect(isPhotoUrl(42)).toBe(false);
    expect(isPhotoUrl('https://example.com/' + 'a'.repeat(2048))).toBe(false);
  });
});
