# Sewmaxx Security Checklist

## Startup and secrets

- [ ] Keep `.env` out of version control
- [ ] Use a strong unique `TELEGRAM_WEBHOOK_SECRET`
- [ ] Use a least-privilege MongoDB user scoped to the Sewmaxx database only
- [ ] Set `BOT_MODE=webhook` in production
- [ ] Set `TELEGRAM_WEBHOOK_URL` to the public HTTPS endpoint in production
- [ ] Restrict `CORS_ALLOWED_ORIGINS` to trusted frontend origins only

## API protection

- [ ] Confirm Helmet headers are active in production
- [ ] Confirm rate limits match expected traffic
- [ ] Keep body size limits small unless a route truly needs more
- [ ] Validate every new route payload with Joi before business logic
- [ ] Use allow-listed field mapping in services to prevent mass assignment
- [ ] Keep error responses minimal and never leak internals

## Database safety

- [ ] Keep unique indexes in place for Telegram user IDs and referral relationships
- [ ] Review all new queries for operator injection risk
- [ ] Preserve query sanitization middleware and Mongoose `sanitizeFilter`
- [ ] Avoid storing secrets, payment data, or chat transcripts in this phase

## Logging and observability

- [ ] Never log raw bot tokens, webhook secrets, or MongoDB URIs
- [ ] Avoid logging full request bodies or sensitive user fields
- [ ] Log request IDs for traceability instead of personal data
- [ ] Send production logs to a secure centralized sink

## Bot security

- [ ] Keep polling for development only
- [ ] Verify Telegram webhook secret headers in production
- [ ] Review anti-spam thresholds for false positives and abuse patterns
- [ ] Add command-specific authorization before future privileged bot actions

## Operational hardening

- [ ] Run behind HTTPS and a trusted reverse proxy
- [ ] Keep dependencies updated and scan regularly for vulnerabilities
- [ ] Add monitoring and alerting for repeated 4xx/5xx spikes
- [ ] Test graceful shutdown during deployment before go-live
