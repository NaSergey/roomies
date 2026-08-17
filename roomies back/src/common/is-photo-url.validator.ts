import { registerDecorator, ValidationOptions } from 'class-validator';

// Ссылка на фото приходит в двух видах, и оба легальны:
//   /uploads/<file>            — то, что вернул наш POST /profile/photo. Путь
//                                намеренно относительный (см. ProfileController#uploadPhoto):
//                                хост подставляет клиент, иначе ссылка намертво
//                                запоминает адрес эфемерного dev-туннеля.
//   https://<host>/<path>      — внешние картинки: аватарка Telegram (photo_url),
//                                сиды.
//
// Раньше здесь стоял @IsUrl(), и относительный путь из нашей же загрузки не
// проходил валидацию: пользователь загружал фото на последнем шаге анкеты и
// намертво застревал на нём с 400. При этом PATCH /profile принимал то же
// значение через @IsString() — то есть два эндпоинта под одно поле разошлись
// в контракте, и заодно в профиль пролезала любая строка.
const RELATIVE_UPLOAD_RE = /^\/uploads\/[A-Za-z0-9._-]+$/;

export function isPhotoUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) {
    return false;
  }
  if (RELATIVE_UPLOAD_RE.test(value)) return true;

  // Только http(s): протокол здесь — данные от клиента, и значение уезжает
  // прямиком в src картинки. data:/javascript:/blob: в этом поле не нужны.
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

export function IsPhotoUrl(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhotoUrl',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'Ссылка на фото должна быть адресом http(s) или путём /uploads/<файл>',
        ...options,
      },
      validator: { validate: (value: unknown) => isPhotoUrl(value) },
    });
  };
}
