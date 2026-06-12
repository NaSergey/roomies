# Phase 1: Onboarding — Context

**Phase:** 1  
**Goal:** Новый пользователь авторизуется через Telegram, проходит 7-шаговый онбординг, данные сохраняются в БД, и он попадает на экран «профиль готов» → SwipeDeck.  
**Requirements:** ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-05, ONBOARD-06, ONBOARD-07  
**Discussed:** 2026-06-07

---

## Решения

### 1. Навигация между шагами (Routing)

**Решение:** State-машина на одном роуте `/` + Telegram BackButton API.

- Один роут `/`. В `HomeView` проверяем `onboardingCompleted`: если `false` — показываем `<OnboardingFlow />`, иначе `<SwipeDeck />`.
- Состояние `{ step: 0–6, answers: {...} }` хранится в `useOnboarding` хуке (React state).
- Telegram's native BackButton (`Telegram.WebApp.BackButton`) управляется программно: `show()` при `step > 0`, `hide()` при `step === 0`. Нажатие → декремент шага.
- Никаких `/onboarding/scenario`, `/onboarding/location` роутов — не нужны, нет URL-навигации.

**Почему:** Telegram WebView имеет системную кнопку «Назад» — BackButton API. Multi-route добавил бы сложность без выгоды; state-машина надёжнее в WebView.

---

### 2. Vibe Quiz UX (ONBOARD-05)

**Решение:** A/B кнопки-чипы, визуал-первый подход. Swipe-жесты — Phase 3+.

- Квиз — отдельный шаг (шаг 4 из 6 в flow).
- Каждый вопрос показывается по очереди: карточка с текстом вопроса + 2 большие кнопки с текстом/эмодзи (вариант A и вариант B).
- Прогресс-бар `N / 10` сверху.
- Tap по кнопке → следующий вопрос (никаких drag-жестов в Phase 1).
- Существующий `SwipeDeck` / `SwipeCard` **не переиспользуется** для квиза — слишком разная механика.

**Почему:** Простота и надёжность в WebView. Swipe-жесты в квизе — улучшение, не MVP.

---

### 3. Вопросы квиза

**Решение:** Хардкод на фронте как TypeScript-константа.

```ts
// features/onboarding/model/quiz-questions.ts
export const QUIZ_QUESTIONS = [
  { id: 1, text: 'Тишина дома — это важно?', optionA: { code: 'silence', label: '🔇 Обязательно', value: 1.0 }, optionB: { code: 'noise', label: '🎵 Шум окей', value: 0.0 }, scale: 'noiseLevel' },
  { id: 2, text: 'Как часто убираешься?', optionA: { code: 'clean_often', label: '🧹 Каждый день', value: 1.0 }, optionB: { code: 'clean_sometimes', label: '😌 По настроению', value: 0.3 }, scale: 'cleanliness' },
  // ... до 10 вопросов
] as const;
```

- `id` соответствует ID строки в таблице `QuizQuestion` (seeds добавляются в миграцию).
- `scale` — поле в User model (noiseLevel, cleanliness, sleepSchedule, socialLevel, workFromHome).
- Бэкенд принимает массив `[{ questionId, optionCode, answerValue }]` — не знает о текстах вопросов.

**Шкалы, покрываемые квизом:**
| Шкала | Поле User | Вопросы |
|-------|-----------|---------|
| Тишина/Шум | `noiseLevel` | 1–2 вопроса |
| Чистота | `cleanliness` | 1–2 вопроса |
| Режим сна | `sleepSchedule` | 1 вопрос |
| Общение дома | `socialLevel` | 1–2 вопроса |
| WFH | `workFromHome` | 1 вопрос |

---

### 4. Фото профиля (ONBOARD-06)

**Решение:** Upload пропускается в Phase 1. URL-заглушка.

- В шаге «Профиль» (шаг 5) пользователь может:
  - Пропустить фото (recommended для MVP)
  - Ввести URL вручную (опционально)
  - Использовать `telegramPhotoUrl` из своего User-профиля (поле уже заполнено из initData)
- `UserPhoto.url` = строка URL. Заглушка: если пользователь ничего не ввёл, сохраняем `telegramPhotoUrl` из User.
- Реальный upload (S3/R2 с presigned URL) — **Phase 3** (редактирование профиля).

---

### 5. Первые мэтчи (ONBOARD-07)

**Решение:** Заглушка «Профиль готов» → SwipeDeck на mock-данных.

- После сохранения последнего шага профиля — экран:
  ```
  ✓ Профиль создан!
  Скоро здесь появятся твои совпадения
  [Смотреть анкеты →]
  ```
- Кнопка → устанавливает `onboardingCompleted = true` в state → `HomeView` переключается на `<SwipeDeck />` (пока на MOCK_PROFILES).
- **Phase 2** заменит MOCK_PROFILES на реальные кандидаты с Match Score.

---

### 6. Сохранение данных (Step Persistence)

**Решение:** POST после каждого шага.

API endpoints (все защищены `JwtAuthGuard`):

| Шаг | Метод | Путь | Данные |
|-----|-------|------|--------|
| 0 | PATCH | `/onboarding/scenario` | `{ scenario: ScenarioType }` |
| 1 | PATCH | `/onboarding/location` | `{ cityId, districtIds: number[] }` |
| 2 | PATCH | `/onboarding/budget` | `{ budgetMin, budgetMax, moveInDate?, stayDurationMonths? }` |
| 3 | PATCH | `/onboarding/dealbreakers` | `{ smokingOk, petsOk, guestsPref }` |
| 4 | POST | `/onboarding/quiz` | `{ answers: [{ questionId, optionCode, answerValue }] }` |
| 5 | PATCH | `/onboarding/profile` | `{ name, photoUrls: string[], vibeTagIds: number[] }` |
| — | GET | `/onboarding/status` | Возвращает `{ onboardingStep, ...savedFields }` для resume |

Каждый PATCH/POST увеличивает `User.onboardingStep`. После `/onboarding/profile` устанавливаем `onboardingCompleted = true`, `quizCompleted = true`.

---

### 7. Города и районы (Geography seeding)

**Решение:** Seed-миграция с 7 городами и их ключевыми районами.

- Бэкенд предоставляет `GET /geo/cities` и `GET /geo/cities/:cityId/districts`.
- Фронт показывает выпадающий список городов + чипы районов.
- **Не используем** free-text ввод города — только из seed-списка.

Города для seed: Москва, Санкт-Петербург, Казань, Новосибирск, Екатеринбург, Краснодар, Нижний Новгород.

---

### 8. Вайб-теги (VibeTag seeding)

**Решение:** Seed-миграция с 20-25 тегами. Фронт фетчит `GET /vibe-tags`.

Примеры тегов: ранняя пташка, сова, люблю готовить, спорт, работаю из дома, домосед, общительный, интроверт, веган, кошатник, собачник, читаю, сериалы, музыка, тишина обязательна и т.д.

---

## FSD-структура (фронтенд)

```
front/
  views/
    home/
      ui/HomeView.tsx          ← уже существует, обновить
  features/
    onboarding/
      ui/
        OnboardingFlow.tsx     ← step router
        steps/
          ScenarioStep.tsx
          LocationStep.tsx
          BudgetStep.tsx
          DealbreakersStep.tsx
          QuizStep.tsx
          ProfileStep.tsx
          DoneStep.tsx
      model/
        use-onboarding.ts      ← state machine
        types.ts
        quiz-questions.ts      ← hardcoded constants
      api/
        onboarding-api.ts      ← per-step API calls
      index.ts
  shared/
    lib/
      api/
        geo.ts                 ← GET /geo/*
        vibe-tags.ts           ← GET /vibe-tags
```

---

## Backend-структура (NestJS)

```
roomies back/src/
  onboarding/
    onboarding.module.ts
    onboarding.controller.ts
    onboarding.service.ts
    dto/
      scenario.dto.ts
      location.dto.ts
      budget.dto.ts
      dealbreakers.dto.ts
      quiz.dto.ts
      profile.dto.ts
      status-response.dto.ts
  geo/
    geo.module.ts
    geo.controller.ts
    geo.service.ts
  vibe-tags/
    vibe-tags.module.ts
    vibe-tags.controller.ts
    vibe-tags.service.ts
```

---

## Что НЕ входит в Phase 1

- Реальный Match Score / ранжирование (Phase 2)
- Загрузка фото через upload (Phase 3)
- Редактирование профиля после онбординга (Phase 3)
- Swipe-жесты в квизе (Phase 3+ UX polish)
- Roomie Score логика (Phase 3)
- Embedding вектор (Phase 2)

---

## Ссылки на схему

- `User` — онбординг-поля, lifestyle scales, onboardingStep, onboardingCompleted
- `UserDistrict` — M2M пользователь ↔ район
- `UserVibeTag` — M2M пользователь ↔ тег
- `UserPhoto` — фото (url строка)
- `UserQuizAnswer` — ответы квиза с answerValue 0.0–1.0
- `QuizQuestion` — seed-данные (id должен совпадать с константой на фронте)
- `City`, `District` — seed-данные
- `VibeTag` — seed-данные

---

*Context created: 2026-06-07*
