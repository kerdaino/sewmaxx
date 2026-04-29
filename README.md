# Sewmaxx

Production-ready Node.js backend for the Sewmaxx Telegram bot and API.

Built by KD Global  
Portfolio: https://www.kdevglobal.com

## Project Description

Sewmaxx connects clients, tailors, affiliates, and coordinators through a Telegram-first workflow backed by an Express API and MongoDB. The system supports role-based onboarding, referral tracking, tailor search, client request posting, request visibility for tailors, and private admin review commands.

This release does not include payments or direct client-tailor messaging.

## Stack

- Node.js 20+
- Express
- MongoDB with Mongoose
- Telegraf
- Joi
- Pino structured logging
- Helmet
- express-rate-limit
- Vitest
- ESLint

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Update `.env` with real credentials and deployment values.

4. Start MongoDB locally or point `MONGODB_URI` at a managed MongoDB deployment.

## Environment Variables

The application validates environment variables at startup. See `.env.example` for the full template.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment: `development`, `test`, or `production`. |
| `PORT` | HTTP server port. |
| `API_PREFIX` | API route prefix, default `/api/v1`. |
| `APP_BASE_URL` | Public application base URL. Must be HTTPS in production. |
| `MONGODB_URI` | MongoDB connection string. |
| `MONGODB_DB_NAME` | MongoDB database name. |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token. |
| `TELEGRAM_BOT_USERNAME` | Telegram bot username, used for referral links. |
| `BOT_MODE` | `polling` for development or `webhook` for production. |
| `BOT_SESSION_TTL_SECONDS` | In-memory bot session expiration. |
| `BOT_SESSION_MAX_SESSIONS` | Maximum tracked in-memory bot sessions. |
| `TELEGRAM_WEBHOOK_PATH` | Express route path for Telegram webhooks. |
| `TELEGRAM_WEBHOOK_SECRET` | Secret checked against Telegram webhook requests. |
| `TELEGRAM_WEBHOOK_URL` | Public HTTPS webhook URL, required in webhook mode. |
| `ADMIN_TELEGRAM_IDS` | Comma-separated Telegram user IDs allowed to use bot admin commands. `TELEGRAM_ADMIN_IDS` and `ADMIN_TELEGRAM_ID` are still accepted for compatibility. |
| `LOG_LEVEL` | Pino log level. |
| `RATE_LIMIT_WINDOW_MS` | API rate limit window. |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum API requests per rate limit window. |
| `JSON_BODY_LIMIT` | JSON request body size limit. |
| `URLENCODED_BODY_LIMIT` | URL-encoded request body size limit. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed CORS origins. |
| `CORS_ALLOW_CREDENTIALS` | Enables credentialed CORS requests when set to `true`. |
| `BOT_SPAM_ENABLED` | Enables Telegram bot anti-spam throttling. |
| `BOT_SPAM_WINDOW_MS` | Bot anti-spam tracking window. |
| `BOT_SPAM_MAX_ACTIONS` | Maximum bot actions per anti-spam window. |
| `TAILOR_DEFAULT_STATUS` | Initial tailor status: `pending_review` or `active`. |
| `TAILOR_TERMS_PDF_URL` | Optional tailor terms PDF shown during onboarding. |
| `ADMIN_DEV_TOKEN` | Bearer token for development admin API endpoints. |
| `ADMIN_ALLOWED_IPS` | Optional comma-separated allowlist for admin API requests. |

## Development

Run the app in development mode:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

Run tests in watch mode:

```bash
npm run test:watch
```

## API Overview

Base prefix defaults to `/api/v1`.

- `GET /api/v1/health`
- `POST /api/v1/onboarding/affiliate`
- `POST /api/v1/onboarding/client`
- `POST /api/v1/onboarding/tailor`
- `POST /api/v1/referrals/track`
- `POST /api/v1/search`
- `POST /api/v1/requests`
- `GET /api/v1/admin/affiliates/recent`
- `GET /api/v1/admin/requests/recent`
- `GET /api/v1/admin/tailors/recent`
- `GET /api/v1/admin/search-sessions/review`

## Telegram Bot Usage

The bot supports role-aware workflows:

- `/start` opens the Sewmaxx role menu.
- `/start <code>` captures an affiliate referral code before onboarding.
- `/help` shows commands available to the current user.
- `/affiliate` starts or resumes affiliate onboarding.
- `/client` starts or resumes client onboarding.
- `/tailor` starts or resumes tailor onboarding.
- `/search` lets onboarded clients find approved tailors by style, city, and budget.
- `/requests` lets onboarded clients post clothing requests for coordinator follow-up.
- `/tailor_requests` lets onboarded tailors view matching active client requests.

Polling mode is intended for local development. Webhook mode is required in production and verifies Telegram's webhook secret header before processing updates.

## Admin Commands

Telegram admin commands are limited to user IDs configured in `ADMIN_TELEGRAM_IDS`.

- `/admin_tailors` lists recent tailor signups.
- `/admin_tailor_detail <id>` opens the private tailor review view and sends submitted KYC/portfolio files.
- `/approve_tailor <id>` approves a tailor profile and activates it.
- `/reject_tailor <id>` rejects a tailor profile and deactivates it.
- `/admin_affiliates` lists recent affiliate signups.
- `/admin_affiliate_detail <id>` opens the private affiliate review view and sends submitted KYC files.
- `/approve_affiliate <id>` approves an affiliate profile and activates it.
- `/reject_affiliate <id>` rejects an affiliate profile and deactivates it.
- `/admin_requests` lists recent client requests.
- `/update_request <id> <pending|reviewing|assigned|completed>` updates request workflow status.

Development admin API routes also require `Authorization: Bearer <ADMIN_DEV_TOKEN>` and may be restricted further with `ADMIN_ALLOWED_IPS`.

## Security And Privacy Notes

- Secrets are loaded from environment variables only.
- Startup validation blocks unsafe production settings such as non-HTTPS URLs and polling mode.
- Structured logs redact common secret fields and avoid logging bot tokens.
- Joi validation is applied to external API payloads.
- Bot text input is sanitized before being stored or used in flows.
- Mongo query filters escape user-provided regular expression input.
- Admin review endpoints and commands intentionally select private fields only for authorized review flows.
- Telegram uploads are stored as Telegram file references and metadata, not downloaded file contents.
- Public tailor search omits private work address and KYC fields.
- Error responses are intentionally minimal.
- Webhook requests must pass Telegram secret verification.

## Production And Deployment Notes

- Use a managed MongoDB deployment with authentication, backups, and network restrictions.
- Set `NODE_ENV=production`, `BOT_MODE=webhook`, and HTTPS `APP_BASE_URL` / `TELEGRAM_WEBHOOK_URL` values.
- Keep `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_DEV_TOKEN`, and database credentials out of source control.
- Use a long random `TELEGRAM_WEBHOOK_SECRET`.
- Put the app behind HTTPS and a reverse proxy or managed platform ingress.
- Limit database permissions to the application database.
- Configure monitoring, alerting, log retention, and backup restore checks before go-live.
- Replace development admin bearer-token access with production staff authentication before exposing admin API routes broadly.

## Project Structure

```text
src/
├── app.js
├── server.js
├── bot/
├── config/
├── constants/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── services/
├── utils/
└── validations/
tests/
└── unit/
```
