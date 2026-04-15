# Sewmaxx Phase 1

Production-ready Node.js backend for the Sewmaxx Telegram bot and API.

## Scope

This phase includes:

- affiliate onboarding
- client onboarding
- tailor onboarding
- referral tracking
- search flow
- request posting flow

This phase does not include:

- payments
- direct client-tailor messaging

## Stack

- Node.js 20+
- Express
- MongoDB with Mongoose
- Telegraf
- Joi
- Pino structured logging
- Helmet
- express-rate-limit

## Security posture

- Secrets are loaded from environment variables only
- Structured logs redact sensitive values
- Joi validation is applied to external inputs
- Text fields are sanitized before persistence
- Unique indexes and atomic upserts reduce duplicate records
- Error responses are intentionally minimal
- Webhook support is designed for secret verification

## Project structure

```text
sewmaxx/
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src
    ├── app.js
    ├── server.js
    ├── bot
    │   ├── index.js
    │   └── handlers
    │       └── start.handler.js
    ├── config
    │   ├── db.js
    │   ├── env.js
    │   └── logger.js
    ├── constants
    │   └── app.constants.js
    ├── controllers
    │   ├── health.controller.js
    │   ├── onboarding.controller.js
    │   ├── referral.controller.js
    │   ├── request.controller.js
    │   └── search.controller.js
    ├── middlewares
    │   ├── error-handler.js
    │   ├── not-found.js
    │   ├── rate-limit.js
    │   └── request-context.js
    ├── models
    │   ├── affiliate.model.js
    │   ├── client.model.js
    │   ├── referral-event.model.js
    │   ├── service-request.model.js
    │   └── tailor.model.js
    ├── routes
    │   ├── health.routes.js
    │   ├── onboarding.routes.js
    │   ├── referral.routes.js
    │   ├── request.routes.js
    │   ├── router.js
    │   ├── search.routes.js
    │   └── webhook.routes.js
    ├── services
    │   ├── onboarding.service.js
    │   ├── referral.service.js
    │   ├── request.service.js
    │   └── search.service.js
    ├── utils
    │   ├── api-error.js
    │   ├── async-handler.js
    │   ├── pick.js
    │   ├── referral-code.js
    │   ├── sanitize.js
    │   └── validators.js
    └── validations
        ├── onboarding.validation.js
        ├── referral.validation.js
        ├── request.validation.js
        └── search.validation.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Update environment variables with real values.

4. Run in development:

```bash
npm run dev
```

## Tests

Run the test suite with:

```bash
npm test
```

Run tests in watch mode with:

```bash
npm run test:watch
```

## API overview

Base prefix defaults to `/api/v1`.

### Health

- `GET /api/v1/health`

### Onboarding

- `POST /api/v1/onboarding/affiliate`
- `POST /api/v1/onboarding/client`
- `POST /api/v1/onboarding/tailor`

### Referral tracking

- `POST /api/v1/referrals/track`

### Search

- `POST /api/v1/search`

### Request posting

- `POST /api/v1/requests`

## Telegram bot

The bot boots with Telegraf and currently supports:

- `/start`
- optional referral code capture via `/start <code>`

Polling is supported for development. Webhook mode is scaffolded for production use with:

- explicit webhook secret verification
- a dedicated webhook path
- no token logging

## Module guide

### `src/config`

Environment loading, MongoDB connection, and structured logging. The logger redacts headers and common secret fields.

### `src/models`

Mongoose schemas with indexes, timestamps, and safe defaults. Unique indexes protect against duplicate onboarding records.

### `src/validations`

Joi schemas for all externally submitted payloads.

### `src/services`

Business logic for onboarding, referral attribution, search, and request posting. Controllers stay thin and services own database interactions.

### `src/controllers`

HTTP handlers that validate, call services, and send minimal responses.

### `src/middlewares`

Request logging, rate limiting, centralized error handling, and 404 handling.

### `src/bot`

Telegraf bootstrap and Telegram command handlers. This is separated from the API so webhook deployment stays clean later.

### `src/utils`

Cross-cutting helpers for sanitization, async error wrapping, API errors, and small reusable utilities.

## Notes for production

- Use a managed MongoDB deployment with authentication and network restrictions
- Put the app behind HTTPS and a reverse proxy
- Prefer webhook mode in production
- Keep Telegram webhook secrets long and random
- Limit database permissions to only the application database
- Add monitoring, alerting, and backup policies before go-live
