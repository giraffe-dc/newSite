# Жирафик — мобільний магістр свят

Сайт виїзної команди «Жирафик» — мобільного магістра свят. Це не заклад з адресою: програму й обладнання привозять на локацію клієнта. Головна дія сайту — заявка з датою, адресою й контактом.

**Поточний публічний шар** — повний перенос макета №2 «Табло маршруту» (див. розділ 13 плану). Усі тексти, ціни, пакети, відгуки й контакти перенесено з демо-макета **як є** й лежать статично в `src/components/board/content.ts`. Демонстраційна форма бронювання показує успіх на клієнті й поки не надсилає дані в `/api/orders`: підключення бази, адмінки й уточнення даних — окремий наступний етап. Чат, опитування, новини, статистика й наявні `/api/*` контракти лишаються працювати.

Проєкт містить адмінку на MongoDB/Mongoose, чат, опитування, статистику й Telegram-нотифікації. Концепція, порівняння напрямків і рішення: `docs/2026-11-04-mobile-master-concept.md`. Поточний стан і борги: `docs/2026-11-10-project-audit.md`. Робочі бренд-асети: `public/brand/`.

## Дизайн-система

`src/styles/tokens.css` — єдине джерело палітри й шрифтів; `src/app/globals.css` — базовий шар; `src/styles/board.css` — публічний шар із префіксом `m2-`. Шрифти `Rubik` + `Rubik Mono One` підключаються через `next/font/google` у `src/app/layout.tsx`. Логотип і фавікон — `public/brand/logo.png` і `public/brand/favicon.png`. Палітра: сафаровий зелений, глиняний, вохра, папір, чорнило; єдиний повторюваний декоративний елемент — смуга під героєм і чорне табло маршруту.

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

> ⚠️ **Безпека:** `src/app/api/auth/route.ts` має запасний хеш за замовчуванням
> (`giraFfe2025`). Без `ADMIN_PASSWORD_HASH` у прод-середовищі цей пароль
> діятиме — обов'язково задайте змінну.

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
      packages/ services/ orders/ survey/
    api/
      auth/ auth/verify/ stats/ orders/ image/
      chat/ chat/poll/ chat/message/
      survey/{submit,vote,results}/
      admin/{home,contacts,features,news,offers,packages,prices,
             price-categories,services,stats,chat-logs,survey/responses}/
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
    googleDrive.ts utils.ts
    services/               # NewsService, StatsService (Mongoose)
    models/                 # News (Mongoose-схема)
  styles/                   # tokens.css, board.css (m2-) + CSS modules
  types/                    # Спільні типи
public/brand/               # logo.png, favicon.png, робочі ассети
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
