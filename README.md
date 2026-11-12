# Жирафик — мобільний магістр свят

Сайт виїзної команди «Жирафик» — мобільного магістра свят. Це не заклад з адресою: програму й обладнання привозять на локацію клієнта. Головна дія сайту — заявка з датою, адресою й контактом.

**Поточний публічний шар** — повний перенос макета №2 «Табло маршруту» (див. розділ 13 плану). Базові тексти, ціни, пакети й контакти лежать у `src/components/board/content.ts` як значення за замовчуванням: після підключення БД публічні сторінки читають секції `site_content` через `getSection()` з ISR 1 год, а правки робляться в `/admin/content`. Демо-цифри й тексти перенесено як є й поки не уточнені. Чат, опитування, новини, статистика й наявні `/api/*` контракти лишаються працювати.

Проєкт містить адмінку на MongoDB/Mongoose, чат, опитування, статистику й Telegram-нотифікації. Концепція, порівняння напрямків і рішення: `docs/2026-11-04-mobile-master-concept.md`. Поточний стан і борги: `docs/2026-11-12-project-audit.md`. Робочі бренд-асети: `public/brand/`.

## Дизайн-система

`src/styles/tokens.css` — єдине джерело палітри й шрифтів; `src/app/globals.css` — базовий шар; `src/styles/board.css` — публічний шар із префіксом `m2-`. Шрифти `Rubik` + `Rubik Mono One` підключаються через `next/font/google` у `src/app/layout.tsx`. Логотип і фавікон — `public/brand/logo.png` і `public/brand/favicon.png`. Палітра: сафаровий зелений, глиняний, вохра, папір, чорнило; єдиний повторюваний декоративний елемент — смуга під героєм і чорне табло маршруту.

## Відгуки

Окрема колекція `reviews`, шар даних `src/lib/reviews.ts`. Форма на `/reviews` пише заявку зі статусом `pending`; головна показує два найновіші `published`. Модерація — `/admin/reviews`: `pending → published | hidden | deleted`, `published → hidden | deleted`, `hidden → published | pending | deleted`. **Видалення м'яке**: запис не видаляється з бази, а переводиться в `deleted` із позначкою `deletedAt` і лишається у фільтрі «Видалені». Відновлення можливе **лише** в `pending` (на перевірку), при цьому `deletedAt` знімається. Прямий `deleted → published` заборонений на рівні API (409). Після зміни статусу `revalidatePath("/", "layout")` скидає кеш `/reviews` і головної.

## Чат із командою

Віджет `src/components/chat/ChatWidget.tsx` має два незалежні режими: «Помічник» (Gemini, логується в `chat_logs`) і «Команда» (людський діалог у колекції `chat_threads`, шар `src/lib/chatThreads.ts`). Ключ діалогу — довговічний `threadId` (`crypto.randomUUID()` у `localStorage`), тому перезавантаження сторінки не обриває переписку: історія тягнеться з `GET /api/chat/history`, відповіді оператора — з `GET /api/chat/poll` раз на 10 с. Публічні записи захищені довжиною тексту (≤2000), honeypot і rate-limit 8/хв на IP.

Адміністратор працює в `/admin/chat` (дві панелі, фільтри за статусом, бейдж непрочитаних у сайдбарі): `GET /api/admin/chat/threads`, `GET|PATCH /api/admin/chat/threads/[id]`, `POST /api/admin/chat/threads/[id]/reply`, `GET /api/admin/chat/stats` — усі під кукою `admin_token`. Статуси `open / closed / archived` **м'які**: з бази нічого не видаляється. Легасі `/api/admin/chat-logs*` лишився для аудиту й зовнішніх інтеграцій, його `DELETE` тепер лише архівує одну сесію, а `reply` дублює відповідь у `chat_threads`.

Міграція старих діалогів — `node scripts/migrate-chat-threads.mjs` (ідемпотентна, `chat_logs` не чіпає). План і залишок по Telegram-мосту: `docs/2026-11-12-chat-admin-telegram-plan.md`. Публічна адреса для майбутнього webhook: https://giraffe-teplyk.vercel.app/.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
- MongoDB: нативний драйвер (`mongodb.ts`) для API-маршрутів, Mongoose для `NewsService`/`StatsService`
- Auth: `bcryptjs` + `jsonwebtoken` (кука `admin_token`, перевірка в `src/middleware.ts`)
- UI: CSS Modules, framer-motion, lucide-react, recharts, xlsx (експорт у адмінці)
- AI-чат: `@google/generative-ai`
- Tooling: Biome (lint/format), Turbopack для `npm run dev`, webpack для `npm run build`
  (прод-збірка з `--turbopack` у Next 15.5.7 не реєструє всі маршрути в `next start`)

## Prerequisites
- Node.js 18+ (recommended LTS)
- MongoDB database (Atlas or self-hosted)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create an environment file `.env.local` in the project root:
```bash
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority

# Auth (JWT для адмінки підписується саме цим ключем — src/lib/auth.ts)
NEXTAUTH_SECRET=replace_with_long_random_string
# Адмінка: логін і bcrypt-хеш пароля (якщо хеш не задано — див. примітку безпеки нижче)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$replace_with_bcrypt_hash
```

> ⚠️ **Безпека:** запасного пароля більше немає. Без `ADMIN_USERNAME` і
> `ADMIN_PASSWORD_HASH` у прод-середовищі `POST /api/auth` повертає 500 і вхід
> до адмінки неможливий — обов'язково задайте обидві змінні.

3. Run the development server:
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

4. Build and start for production:
```bash
npm run build
npm start
```

## NPM Scripts
- `dev`: start Next.js dev server with Turbopack
- `build`: production build (webpack — див. примітку в Tech Stack)
- `start`: start production server
- `lint`: run Biome checks
- `format`: format code with Biome
- `analyze`: enable bundle analyzer during build

## Project Structure
```
src/
  app/
    page.tsx                # Головна: композиція з board/Home (8 секцій)
    services/ packages/ reviews/ faq/ cover/ book/   # Публічні сторінки
    about/ calculator/ prices/ news-contacts/ news/[id]/
    order/ portfolio/        # Старі URL → 308 на /book і /reviews
    admin/
      layout.tsx            # Admin shell (AdminSidebar + AdminHeader)
      page.tsx              # Dashboard
      login/ home/ contacts/ features/ news/ prices/ offers/
      packages/ services/ orders/ survey/ content/ reviews/ chat/
    api/
      auth/ auth/verify/ stats/ orders/ image/
      chat/ chat/poll/ chat/message/ chat/history/
      survey/{submit,vote,results}/
      admin/{home,contacts,features,news,offers,packages,prices,
             price-categories,services,stats,content,reviews,chat-logs,
             chat/{threads,threads/[id],threads/[id]/reply,stats},
             survey/responses}/
      data/{home,contacts,news,offers,price-categories,prices,
            faq,portfolio,packages,services,testimonials}/
  components/
    board/                  # Публічний шар mac2: Home, Sections, BookingForm,
                            #   Calculator, content.ts (усі тексти й ціни)
    Header.tsx Footer.tsx ChatWidget.tsx StatisticsCollector.tsx
    NewsPageClient.tsx NewsSlider.tsx SurveyVote.tsx SurveyFreeForm.tsx
    BookingModal.tsx        # Референс POST /api/orders (не підключений)
    AdminLayout/ admin/ chat/
    ui/                     # button, Toast — лише для BookingModal
  lib/
    mongodb.ts              # Спільний clientPromise (нативний драйвер MongoDB)
    auth.ts                 # JWT + bcryptjs helpers
    adminRequest.ts         # Перевірка підпису admin_token у /api/admin/*
    chatThreads.ts          # chat_threads: модель, індекси, poll, історія
    chatRateLimit.ts        # Ліміт публічного POST /api/chat/message
    reviews.ts              # Статуси й переходи відгуків
    googleDrive.ts utils.ts
    services/               # NewsService, StatsService (Mongoose)
    models/                 # News (Mongoose-схема)
  styles/                   # tokens.css, board.css (m2-) + CSS modules
  types/                    # Спільні типи
public/brand/               # logo.png, favicon.png, робочі ассети
scripts/                    # migrate-chat-threads.mjs (одноразова міграція)
```

## Data & Auth Overview
- MongoDB через **нативний драйвер** (`clientPromise` у `src/lib/mongodb.ts`); Mongoose використовують лише `NewsService`/`StatsService` зі схемою `src/lib/models/News.ts`.
- `src/lib/db.ts` — Mongoose-підключення, його імпортують сервіси.
- Authentication: `bcryptjs` для хешування пароля, JWT через `jsonwebtoken`; сесійна кука `admin_token`, перевірка — `src/middleware.ts`.
- Admin APIs are namespaced under `src/app/api/admin/*` and should be protected; public data under `src/app/api/data/*`.
- `StatisticsCollector` component records visits via `src/app/api/stats/route.ts`.

## Environment Variables
- `MONGODB_URI`: connection string to your MongoDB database
- `NEXTAUTH_SECRET`: ключ підписання JWT для адмінки (`src/lib/auth.ts`)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`: логін і bcrypt-хеш пароля адмінки
- `GEMINI_API_KEY`: ключ Google Generative AI для чату (`/api/chat`)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID(_2/_3)`, `TELEGRAM_CHAT_IDS`,
  `TELEGRAM_BOT_TOKEN_SURVEY`: сповіщення про заявки й опитування
- `NOTIFICATIONS_BASE_URL`, `NOTIFICATIONS_API_KEY`: webhook заявок і `/api/admin/chat-logs`
- `NEXT_PUBLIC_API_URL`: базовий URL для проксі Google Drive (`/api/image`)
- `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_IDS`: **поки не використовуються** —
  знадобляться для вхідного Telegram-webhook (Етап 3 плану чату)
 
### Telegram Notifications
To receive booking notifications in Telegram, add:
```bash
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
```
Notes:
- Create a bot via BotFather and take the token.
- `TELEGRAM_CHAT_ID` can be a user ID or a channel/group ID (for groups, ensure the bot is a member and has permission to send messages).

## Deployment
- Any Node.js host (Vercel, Render, etc.).
- Ensure `.env` variables are set in the hosting platform.
- Optionally run bundle analysis with `npm run analyze` during CI to inspect sizes.

## Contributing
- Use Biome for linting and formatting:
```bash
npm run lint
npm run format
```
- Keep components and API routes typed and modular.

## License
Proprietary. All rights reserved unless stated otherwise.
