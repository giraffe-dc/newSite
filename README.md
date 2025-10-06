# Giraffe Family Center

A Next.js 15 (App Router) application for the Giraffe Family Center website with an admin dashboard, MongoDB-backed content management, and public pages for prices, news, and contacts.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
- MongoDB with Mongoose
- Auth with next-auth, bcryptjs, jsonwebtoken
- UI: CSS Modules, framer-motion, lucide-react, react-hook-form, recharts
- Tooling: Turbopack, Biome (lint/format)

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

# Auth
JWT_SECRET=replace_with_long_random_string
NEXTAUTH_SECRET=replace_with_long_random_string
# If using next-auth email/OAuth providers, add their specific envs here
```

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
- `build`: production build with Turbopack
- `start`: start production server
- `lint`: run Biome checks
- `format`: format code with Biome
- `analyze`: enable bundle analyzer during build

## Project Structure
```
src/
  app/
    page.tsx                # Home page
    prices/page.tsx         # Public prices page
    news-contacts/page.tsx  # Public news & contacts page
    admin/
      layout.tsx            # Admin layout
      page.tsx              # Admin dashboard
      login/page.tsx        # Admin login
      home/page.tsx         # Admin Home CMS
      contacts/page.tsx     # Admin Contacts CMS
      features/page.tsx     # Admin Features CMS
      news/page.tsx         # Admin News CMS
      prices/page.tsx       # Admin Prices CMS
    api/
      auth/route.ts
      auth/verify/route.ts
      stats/route.ts
      admin/{home,contacts,features,news,price-categories,prices,stats}/route.ts
      data/{home,contacts,news,price-categories,prices}/route.ts
  components/
    AdminLayout/            # Admin UI shell
    Header.tsx, Footer.tsx, Hero.tsx, Slider.tsx, PhotoSlider.tsx
    PriceCard.tsx, NewsCard.tsx, HomePageClient.tsx, StatisticsCollector.tsx
    ui/                     # UI primitives
  lib/
    mongodb.ts              # MongoDB connection
    auth.ts                 # Auth helpers
    utils.ts                # Shared utilities
  styles/                   # CSS modules for public and admin
  types/                    # Shared TypeScript types
public/                     # Static assets
```

## Data & Auth Overview
- MongoDB via `mongoose` with a shared connection utility in `src/lib/mongodb.ts`.
- Authentication uses `next-auth` and `bcryptjs` for password hashing; JWTs handled via `jsonwebtoken`.
- Admin APIs are namespaced under `src/app/api/admin/*` and should be protected; public data under `src/app/api/data/*`.
- `StatisticsCollector` component records visits via `src/app/api/stats/route.ts`.

## Environment Variables
- `MONGODB_URI`: connection string to your MongoDB database
- `JWT_SECRET`: secret for JWT signing/verification
- `NEXTAUTH_SECRET`: secret for next-auth session encryption
- Add any provider-specific secrets if social/email providers are configured
 
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
