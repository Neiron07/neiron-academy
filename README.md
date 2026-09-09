# Neiron Platform — v1 (backend)

Единая платформа IT-школы: кабинеты ученика, родителя, преподавателя и администратора
поверх одной базы. Заменяет собой прежнюю CRM, Google Classroom и таблицу финансов.

Стек: **Node 20+, TypeScript, Fastify 4, PostgreSQL (Supabase), argon2, JWT, croner**.

---

## Запуск

```bash
cp .env.example .env       # заполнить DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install
npm run migrate            # схема + функции
npm run seed               # курсы, ачивки, товары магазина
npm run create-admin       # первый администратор
npm run dev
```

### Про две строки подключения

Supabase даёт два пулера, и их **нельзя путать**:

| Переменная | Порт | Назначение |
|---|---|---|
| `DIRECT_URL` | 5432 | миграции, DDL (session pooler) |
| `DATABASE_URL` | 6543 | приложение (transaction pooler) |

Transaction pooler не держит prepared statements и часть DDL — миграции через него упадут.

### Безопасность на старте

1. **Смените пароль базы** в Supabase → Settings → Database → Reset database password.
   Старый считать скомпрометированным.
2. `JWT_SECRET` — `openssl rand -hex 48`.
3. `.env` в `.gitignore`, в репозиторий не коммитить.
4. RLS включён на всех таблицах **без политик**: даже если anon-ключ утечёт во фронтенд,
   через него ничего не прочитать. Права проверяет бэкенд.

---

## Архитектура

```
Landing (public)  ──► POST /api/public/leads
                        │
                   /login (3 способа входа)
                        │
        ┌───────────────┼───────────────┬──────────────┐
     ученик          родитель        препод          админ
   login + PIN     тел + WhatsApp   тел + пароль   тел + пароль
        │               │               │              │
        └───────────────┴───────────────┴──────────────┘
                        │
                 Fastify API (RBAC на каждом запросе)
                        │
                 PostgreSQL (Supabase)
                        │
              cron: расписание, уведомления, чемпионы
```

**Ключевое правило: источник истины — урок.** Завершение урока тянет за собой
посещаемость → коины → XP → ачивки → фидбек родителю → списание с абонемента.

---

## Инварианты, которые нельзя нарушать

1. **Баланс коинов меняется только через SQL-функцию `apply_coins`.**
   Она блокирует строку ученика, не даёт уйти в минус и идемпотентна по ключу.
   Прямой `INSERT` в `coin_transactions` из приложения — ошибка ревью.

2. **`coin_transactions` — append-only.** `UPDATE` и `DELETE` заблокированы триггером.
   Ошибку исправляем компенсирующей транзакцией (`POST /api/admin/coins/adjust`),
   а не правкой истории. Это спасёт в споре с родителем.

3. **Все автоматические начисления имеют ключ идемпотентности:**
   `att:<lesson>:<student>`, `punc:…`, `hw:<submission>`, `streak:<student>:<n>`,
   `buy:<order>`, `ach:<student>:<code>`. Повторная отметка посещаемости не удвоит коины.

4. **Лимит ручных коинов — 30 на группу за урок.** Иначе один щедрый препод
   обрушит экономику, а второй будет выглядеть жадиной.

5. **Родитель видит только своих детей** — проверка запросом к `parents_students`
   на каждый вызов, не редиректом во фронте.

6. **Урок нельзя закрыть, не отметив всю группу.** Незакрытые уроки висят
   в `/api/teacher/today → overdue` и в дашборде админа.

---

## Экономика коинов

Все цифры в одном месте: `src/lib/rules.ts`.

| Событие | Коины | XP |
|---|---|---|
| Посещение урока | 10 | 10 |
| Пришёл вовремя | +5 | +5 |
| Урок отменила школа | 10 | 10 |
| Домашка в срок | 15 | 15 |
| Домашка после дедлайна | 7 | 7 |
| Надбавка за «отлично» | +10 | +10 |
| 4 урока подряд | 30 | 30 |
| Ручные от препода | 5–20 | = |

Потолок ученика ≈ **490 коинов в месяц** при 12 уроках.
Отсюда считаются цены магазина. Держите расходы на призы ≤ 5% выручки —
проверяется отчётом `GET /api/admin/shop-report` (эмиссия, списание, себестоимость в тенге).

**Две валюты не случайно.** Коины тратятся, XP — нет. Если бы валюта была одна,
ребёнок, потративший коины, падал бы в рейтинге, и дети перестали бы покупать.

**Маскот:** 10 уровней XP, 5 стадий эволюции (яйцо → птенец → ученик → инженер → мастер).

---

## API

### Публичное
```
GET  /api/public/courses
POST /api/public/leads              заявка с лендинга → лид + WhatsApp админу
```

### Авторизация
```
POST /api/auth/staff/login          телефон + пароль        (admin, teacher)
POST /api/auth/student/login        логин + 4-значный PIN   (student)
POST /api/auth/parent/request-code  телефон → код в WhatsApp
POST /api/auth/parent/verify        телефон + код
GET  /api/auth/me
POST /api/auth/logout               инкремент token_version — убивает все сессии
```

Сроки жизни токенов: ученик 90 дней, родитель 30, сотрудник 7.
Дети не должны вводить PIN каждый день.

### Преподаватель
```
GET  /api/teacher/today             сегодняшние + просроченные уроки
GET  /api/teacher/schedule
GET  /api/teacher/groups
GET  /api/teacher/groups/:id
GET  /api/teacher/orders/pending    заказы к выдаче
POST /api/teacher/orders/:id/issue
POST /api/teacher/students/:id/reset-pin
```

### Урок (главный экран платформы)
```
GET  /api/lessons/:id               состав + темы + остаток лимита коинов
POST /api/lessons/:id/attendance    present | late | excused | absent
POST /api/lessons/:id/coins         ручное начисление
POST /api/lessons/:id/complete      завершить (требует полной посещаемости)
POST /api/lessons/:id/feedback      окно 24 часа
POST /api/lessons/:id/cancel        только админ
```

### Ученик
```
GET  /api/me/profile                маскот, коины, ачивки, ближайший урок
GET  /api/me/transactions
GET  /api/me/rating                 рейтинг внутри группы, сезон = месяц
GET  /api/me/schedule
GET  /api/me/inventory
POST /api/me/equip
```

### Магазин
```
GET  /api/shop                      каталог + флаг affordable
POST /api/shop/:itemId/buy
GET  /api/shop/orders
```

### Домашки
```
POST /api/homework                          препод: выдать
GET  /api/homework/:id/submissions          препод: список сдач
POST /api/homework/submissions/:id/review   accepted | excellent | rework
GET  /api/homework/my                       ученик
POST /api/homework/:id/submit               ученик
```

### Родитель
```
GET /api/parent/children
GET /api/parent/children/:id/overview
GET /api/parent/children/:id/attendance
GET /api/parent/children/:id/feedback
GET /api/parent/children/:id/homework
GET /api/parent/children/:id/payments
GET /api/parent/children/:id/schedule
```

### Администратор
```
GET   /api/admin/dashboard      уроки, незакрытые, загрузка групп, зона риска, долги
GET   /api/admin/shop-report
POST  /api/admin/students       создаёт ученика + родителя, возвращает логин и PIN
GET   /api/admin/students
POST  /api/admin/students/:id/enroll
POST  /api/admin/teachers
POST  /api/admin/groups         вместе с расписанием, сразу генерит уроки
POST  /api/admin/payments
GET   /api/admin/payments
POST  /api/admin/coins/adjust
POST  /api/admin/shop-items
GET   /api/admin/leads
PATCH /api/admin/leads/:id
```

---

## Фоновые задачи (`src/jobs/index.ts`)

| Расписание | Задача |
|---|---|
| 03:00 ежедневно | раскатка `group_schedule` в уроки на 14 дней вперёд |
| каждую минуту | отправка очереди уведомлений (Green API) |
| каждые 15 минут | напоминание за 2 часа до занятия |
| 18:00 ежедневно | «осталось 2 занятия по абонементу» |
| 1 числа в 09:00 | ачивка «Чемпион группы» по итогам месяца |
| 04:30 ежедневно | чистка отработавших OTP |

Уведомления пишутся в таблицу-очередь, а не отправляются синхронно: падение
Green API не должно ломать проведение урока. Дедупликация по `dedupe_key`.

---

## Ачивки (12 штук, все автоматические)

`first_step` · `first_project` · `no_day_off` · `early_bird` · `iron_month` ·
`straight_a` · `no_rework` · `marathoner` · `graduate` · `group_champ` · `rich` · `pioneer`

Логика в `src/lib/achievements.ts`, выдача идемпотентна (PK на паре ученик+код).

---

## Что НЕ входит в v1

Сознательно отложено, чтобы запуститься за 5 недель:
онлайн-оплата Kaspi (платежи вносятся вручную), расчёт зарплат, CRM-воронка,
рефералы, сертификаты, портфолио, NPS, отработки с переносом в другую группу,
библиотека методик, месячные PDF-отчёты, общешкольный рейтинг, заморозка абонемента,
конструкторы правил в админке, мультифилиальность в UI (`branch_id` в базе уже есть).

---

## Дальше

Не сделано в этом пакете: **фронтенд** — лендинг и четыре кабинета на Next.js.
Бэкенд к нему готов: API стабилен, форматы ответов заточены под конкретные экраны.

Перед первым прогоном на боевой базе: применить миграции на ветке Supabase
(Database → Branches), убедиться, что схема встала, и только потом на production.
