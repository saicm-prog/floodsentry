# Flood Sentry

A static React + Vite + TypeScript guide to understanding different types of storms.

## Commands

```bash
npm install
npm run dev
npm run dev:api
npm run build
```

The production output is generated in `dist/`. Configure the hosting provider to build from the `main` branch with `npm run build` and publish `dist`.

## Resend local alerts

The simulator records every event locally and sends matching ZIP-code alerts through Resend when the API is configured. Copy `.env.example` to `.env`, then set:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Flood Sentry <alerts@your-verified-domain.example>"
```

The sender address must be a verified Resend domain or the Resend-provided testing sender. Keep `.env` private; it is ignored by Git. Start the API with `npm run dev:api` before using `/simulate`.
