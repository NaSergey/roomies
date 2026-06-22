# Uncommitted Work — Inventory

**Created:** 2026-06-21
**Status:** Реализовано в рабочей копии, НЕ закоммичено. Идёт впереди роадмапа (в основном территория Phase 3 — Discovery & Profiles + кросс-каттинг инфраструктура).
**Purpose:** Чтобы любая будущая AI-сессия знала обо всех изменениях, не отражённых в git-истории.

> Эта работа сделана вне формального GSD-цикла (ad-hoc UX/инфра-итерации поверх завершённой Phase 2).
> При планировании Phase 3 — учитывать, что часть задач уже выполнена (см. ниже), не дублировать.

---

## Сводка по областям

| # | Область | Тип | Статус |
|---|---------|-----|--------|
| 1 | Telegram WebApp / fullscreen | Фикс + рефактор | ✅ Готово |
| 2 | Нижняя навигация (BottomNav) | Новая фича (UI) | ✅ Готово (чат/профиль — заглушки) |
| 3 | React Query | Инфраструктура | ✅ Готово |
| 4 | Лента: фильтры + буст | Новая фича (UI) | ⚠️ UI готов, фильтры локальные (нет связи с API) |
| 5 | Анимация свайпа (колода) | Рефактор + перф | ✅ Готово |
| 6 | ProfileCard (возраст, скоры, стиль) | UI | ✅ Готово |
| 7 | Backend: возраст + жёсткие фильтры ленты | Бэкенд | ✅ Готово |
| 8 | Тема / шрифты / layout | UI-инфра | ✅ Готово |
| 9 | Инфра / тулинг (docker, tunnel, docs) | Tooling | ✅ Готово |

---

## 1. Telegram WebApp / fullscreen

**Проблема:** на старых клиентах (Bot API 6.0) `requestFullscreen` писал «Method is not supported»; на десктопе приложение открывалось то на весь экран, то «забагованным» в зависимости от точки входа.

**Решение:**
- `shared/lib/telegram/use-telegram-web-app.ts` — fullscreen запрашивается ТОЛЬКО на мобилке (`isMobilePlatform()`) и при `isVersionAtLeast('8.0')`; `disableVerticalSwipes` гейтится `7.7`. На десктопе — `expand()` (окно). Считаются `--tg-safe-top` из device + content инсетов.
- `shared/types/telegram.d.ts` — добавлены `version`, `isVersionAtLeast`, safe-area типы.
- `shared/lib/telegram/telegram-provider.tsx` **(новый)** — `TelegramProvider`: контейнер `h-dvh` + safe-area padding (`--tg-safe-top` сверху, `env(safe-area-inset-bottom)` снизу).
- `shared/lib/telegram/index.ts` — реэкспорт `TelegramProvider`.

**Ключевое правило:** fullscreen — мобильный иммерсив; десктоп всегда в окне.

---

## 2. Нижняя навигация (BottomNav)

**Новый виджет** `widgets/bottom-nav/` — минималистичная панель на всю ширину (`max-w-md`), 3 вкладки: **Чат · Карточки · Профиль** (карточки по центру = основной экран).

- Иконки без подписей; активная вкладка — скользящий лаймовый индикатор (`translateX`, spring-easing) + scale активной иконки. Хаптик на тап.
- `shared/ui/icons/NavIcons.tsx` **(новый)** — `ChatIcon`, `CardsIcon`, `ProfileIcon`.
- `widgets/chat/` **(новый, заглушка)** — `ChatView` (экран появится в Phase 4 Chat & Agreement).
- `widgets/profile/` **(новый, заглушка)** — `ProfileView` (экран своего профиля — Phase 3 PROF-01–04).
- `widgets/home/ui/HomeView.tsx` — `MainShell` держит состояние вкладки и рендерит активный экран + `BottomNav`.

**Архитектурно:** навбар в `widgets/` (не в `app/layout`), т.к. нужен только в состоянии `main`; состояние вкладки живёт в композиции view.

---

## 3. React Query (@tanstack/react-query)

**Инфраструктура** замены ручных `useEffect`+`useState` фетчей.

- `shared/lib/query/` **(новый)** — `client.ts` (QueryClient: staleTime 5мин, retry 1, refetchOnWindowFocus off), `provider.tsx` (`ReactQueryProvider`), `index.ts`.
- `app/layout.tsx` — обёрнут `ReactQueryProvider` (внешний) → `TelegramProvider` → children.
- `features/swipe-profile/model/use-feed-query.ts` **(новый)** — `useFeedQuery` (queryKey `['feed']`), `useSwipeMutation` (инвалидирует фид на `like`), `feedKeys`.
- `widgets/swipe-deck/ui/SwipeDeck.tsx` — фид через `useFeedQuery`/`useSwipeMutation`; `handleReset` → `refetch()`.
- `widgets/home/ui/HomeView.tsx` — статус онбординга через `useQuery(['onboarding-status'])`, `staleTime: Infinity`.
- `package.json` — добавлен `@tanstack/react-query`.

---

## 4. Лента: панель фильтров + кнопка буст

**Новый UI** на странице карточек. ⚠️ **Фильтры пока локальные (React state), к API НЕ подключены** — нужно довести в Phase 3 (feed-фильтрация на бэке).

- `widgets/swipe-deck/ui/DeckToolbar.tsx` **(новый)** — строка сверху: кнопка «Фильтры» (со счётчиком активных) + горизонтальный скролл активных чипов + кнопка «⚡ Буст» (анимация иконки; буст пока только toggle-состояние, без логики).
- `widgets/swipe-deck/ui/FilterSheet.tsx` **(новый)** — нижняя шторка (`fixed`, поверх навбара), фильтры: Возраст / Режим / Чистота / Бюджет. Закрытие по бэкдропу/Escape/кнопке. «Сбросить» → дефолт.
- `SwipeDeck.tsx` — состояния `filters`/`filterOpen`/`boosted`, интеграция тулбара и шторки.

**TODO Phase 3:** прокинуть `DeckFilters` в `GET /feed` (query-параметры) + реализовать буст (приоритет показа).

---

## 5. Анимация свайпа — механика «колоды» + производительность

**Проблема:** лаги в Telegram-webview (ререндер тяжёлой карточки с SVG-фильтром на каждый кадр драга); следующая карта была не видна до отпускания.

**Решение:**
- `features/swipe-profile/ui/SwipeCard.tsx` — драг полностью **императивный** (пишем `style.transform` напрямую, без `setState` на кадр). `forwardRef`: верхняя карта через `getPeerEl()` в реальном времени **подращивает следующую** (Tinder-стек: следующая видна за верхней при `scale 0.92` и растёт к `1.0` по мере драга). Вылет/въезд/покой — через `useLayoutEffect`. GPU-слой через `will-change: transform` (фильтр растеризуется один раз).
- `features/swipe-profile/model/use-swipe-deck.ts` — `VISIBLE_STACK=3` (верх + видимая следующая + предзагруженный запас), одновременный exit/enter, `lockRef` от двойного свайпа, `swipe()` возвращает `boolean`.
- `features/swipe-profile/index.ts` — экспорт `useFeedQuery`/`useSwipeMutation`/`feedKeys`.
- `entities/profile/ui/ProfileCard.tsx` — обёрнут в `memo` (не пересобирает SVG-фильтр на ререндерах родителя); оверлеи LIKE/NOPE мемоизированы.
- `widgets/swipe-deck/ui/SwipeDeck.tsx` — `Map` DOM-нод карт по `profile.id` + `getPeerEl` для верхней; мутация не шлёт дубль, если анимация идёт.
- `features/swipe-profile/ui/ActionButtons.tsx` — редизайн в нео-брутализм (белый pass / бирюзовый message-овал / лаймовый like, чёрная обводка + жёсткие тени, новые SVG-иконки).

---

## 6. ProfileCard — возраст, скоры, визуал

- `entities/profile/model/types.ts` — `RoomieProfile.age?: number`.
- `entities/profile/ui/ProfileCard.tsx` — возраст рядом с именем (`font-age`/Outfit); скоры — вертикальная колонка справа, каждая наклейка под наклоном; нео-брутализм + рваная SVG-рамка (`feTurbulence`/`feDisplacementMap`), стеклянная инфо-панель, теги-стикеры из палитры рамки.

---

## 7. Backend — возраст + жёсткие фильтры ленты

- `roomies back/src/feed/feed.service.ts` — `calculateAge(birthDate)` → поле `age` в ответе `/feed`; **жёсткие фильтры (smoking/pets/budget) перенесены в SQL `where`** (раньше `take:100` мог набрать кандидатов, которые целиком отсеивались в JS → пустая лента).
- `roomies back/prisma/seed.ts` — `birthDateFromSeed(telegramId)` (детерминированные 18–30 лет) для основных fake-профилей.
- `roomies back/prisma/seed-bulk-users.ts` **(новый)** — генерация 1000 пользователей (telegramId с `1_200_000_001n`, рус. имена M/F) для нагрузочного наполнения ленты.

---

## 8. Тема / шрифты / layout

- `app/globals.css` — фон сменён на градиент (`linear-gradient(170deg,#e1ddf8,#9bb1f7)`); добавлен `--tg-safe-top`; шрифты `--font-sans: Golos Text`, `--font-age: Outfit`.
- `app/layout.tsx` — подключены Golos Text (cyrillic) + Outfit (цифры возраста) + Geist Mono; `<script telegram-web-app.js>`; eruda в dev; провайдеры.
- `features/onboarding/ui/OnboardingFlow.tsx` — `h-dvh` → `h-full` (высоту теперь держит `TelegramProvider`).

---

## 9. Инфра / тулинг

- `docker-compose.yml` **(новый)** — Postgres 16-alpine (db `roomies`, порт 5432, volume).
- `dev-tunnel.ps1` — убивает зависшие `cloudflared` перед удалением лог-файла.
- `AGENTS.md` **(новый, корень)** — гайд проекта (на него ссылается `front/CLAUDE.md` через `@AGENTS.md`); плюс `front/AGENTS.md` (предупреждение про breaking changes Next.js).

---

## Открытые хвосты (для будущих фаз)

- **Phase 3:** подключить `DeckFilters` к `GET /feed`; реализовать буст; реальный экран `ProfileView`; загрузка фото (upload).
- **Phase 4:** реальный `ChatView`.
- **Тех-долг:** фильтры/буст — UI без бэка; навбар-вкладки чат/профиль — заглушки.

---

*Если эта работа будет закоммичена/разнесена по планам — удалить или обновить этот файл и убрать указатель из STATE.md.*
