# Roomie App

## What This Is

Telegram Mini App для поиска сожителей среди аудитории 18–30 лет, основанный на точном мэтчинге по вайбу и образу жизни. Пользователь проходит 7-шаговый онбординг (включая Vibe Quiz), получает совпадения с объяснением причин и общается с кандидатами напрямую в приложении. Четыре сценария: ищу жильё + roomie, есть жильё, ищу roomie (жильё найдём вместе), squad (2–4 человека).

## Core Value

Пользователь получает первые качественные совпадения по вайбу за 3 минуты онбординга и понимает, почему ему показали именно этого человека.

## Requirements

### Validated

- ✓ Аутентификация через Telegram Mini App (initData + JWT) — existing
- ✓ Полная Prisma-схема БД (User, Swipe, Match, Chat, Squad, Verification, Boost, Purchase и др.) — existing
- ✓ Swipe UI (карточки, жесты, LIKE/NOPE оверлеи, haptics) на моковых данных — existing
- ✓ Feature-Sliced Design архитектура фронтенда (FSD) — existing
- ✓ Telegram SDK интеграция (theme sync, haptics, WebApp init) — existing

### Active

- [ ] Онбординг: 7-шаговый флоу (сценарий → локация → бюджет → dealbreakers → Vibe Quiz → профиль → первые мэтчи)
- [ ] Алгоритм мэтчинга: Hard (35%) + Lifestyle (30%) + Vibe (25%) + Behavioral (10%)
- [ ] Discovery лента: реальные карточки из БД с % совместимости и причинами мэтча
- [ ] Детальный профиль кандидата с блоком «Почему вы совпали»
- [ ] Чат между мэтчами: текст, голосовые, smart-chips, назначение созвона
- [ ] Roomie Agreement в чате: согласование правил дома
- [ ] Squad режим: создание/вступление, совместный поиск
- [ ] Профиль пользователя с Roomie Score и верификацией
- [ ] Система жалоб и блокировок
- [ ] Push-уведомления: мэтч, сообщение, напоминание о созвоне
- [ ] Платные функции: Boost профиля, просмотр «кто лайкнул»
- [ ] Post-match feedback («вайб совпал?»)

### Out of Scope

- Web-версия (не Telegram) — Telegram-first стратегия
- Нативные мобильные приложения (iOS/Android) — defer
- Объявления о жилье / листинги квартир — не доска объявлений
- Встроенный видеозвонок — слишком сложно, defer
- Детальные хобби и биографические вопросы — низкая предсказательная сила по спецификации
- Философские вопросы в квизе — осознанно исключены из дизайна

## Context

**Существующая база:**
- NestJS 11 бэкенд с Prisma 7 + PostgreSQL. Вся схема БД спроектирована (25+ таблиц).
- Next.js 16 фронтенд с FSD архитектурой. Работает swipe UI на моковых данных (MOCK_PROFILES).
- Аутентификация полностью работает (Telegram initData → JWT).
- Swagger-документация доступна на `/api`.

**Технические ограничения:**
- Telegram Mini App открывается в WebView — интерфейс должен работать в рамках Telegram.
- `telegramId` — BigInt, является основным идентификатором везде.
- Фронт и бэк — единое монорепо (переведено из двух отдельных репо).

**Аудитория:** Gen Z (18–30 лет), Россия. Тон: дружелюбный, короткий, без канцелярита («ты»-форма).

## Constraints

- **Platform**: Telegram Mini App — только WebView, window.Telegram.WebApp SDK
- **Identity**: Telegram-first, email/phone опциональны, telegramId всегда BigInt
- **Stack**: NestJS + Prisma + PostgreSQL (бэк), Next.js + Tailwind v4 + FSD (фронт) — не менять
- **UX**: 1 мысль = 1 экран, заголовки ≤36 символов, кнопки 1–2 слова (глагол)
- **Auth window**: initData действителен 24h, после — переавторизация

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Telegram Mini App (не standalone) | Нет барьера установки, Telegram = source of identity | — Pending |
| BigInt для telegramId | Telegram ID может превышать Int32 | ✓ Good |
| Монорепо (front + back) | Атомарные коммиты, общие типы, один CI/CD | — Pending |
| FSD архитектура фронтенда | Строгая слоистость, масштабируемость | — Pending |
| Vibe Quiz вместо биографии | Меньше вопросов → больше правды → лучше мэтч | — Pending |
| Hard Compatibility = 0 при конфликте | Без базовой совместимости жить вместе невозможно | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-07 after initialization*
