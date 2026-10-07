# Flood Sentry

A static React + Vite + TypeScript guide to understanding different types of storms.

## Commands

```bash
npm install
npm run dev
npm run dev:api
npm run build
npm test
```

The production output is generated in `dist/`. Configure the hosting provider to build from the `main` branch with `npm run build` and publish `dist`.

## Resend local alerts

The simulator records every event locally and sends matching ZIP-code alerts through Resend when the API is configured. Copy `.env.example` to `.env`, then set:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Flood Sentry <alerts@your-verified-domain.example>"
```

The sender address must be a verified Resend domain or the Resend-provided testing sender. Keep `.env` private; it is ignored by Git. Start the API with `npm run dev:api` before using `/simulate`.

## Weather bulletin simulator

Add these server-only settings to the project-root `.env` alongside the Resend settings:

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1
```

Restart `npm run dev:api` after changing `.env`, or use `npm run dev:all` to start both services. Never prefix these secrets with `VITE_`.

The `/simulate` page has one multiline weather-report input, prefilled with the June 10, 2012 Tennessee example. Submitting sends `POST /api/test-alert` with `{ "weatherReport": "..." }`:

1. The server calls OpenAI Responses with required web search and structured output to identify the affected areas and their ZIP codes, including lookup evidence and source links.
2. A separate model request uses the report and coverage to draft the resident email. No subscriber emails or database records are sent to OpenAI.
3. The server records one local notification per distinct ZIP, matches subscriptions across all those ZIPs, and sends each matching email one TEST message through Resend. The page shows coverage, citations, message, subscriber count, and delivery results.

All simulated messages are explicitly marked TEST and retain report dates. County-to-ZIP lookup is approximate and can miss ZIPs or include areas outside a warning polygon; it is not a precise geospatial alerting system. NWS county codes are never treated as ZIP codes. Unsupported ZIPs or failed model calls stop processing before any records or emails are created. Missing Resend settings or delivery failures leave the local event saved and show a dismissible error. Re-running a report creates a new event and may send the emails again.

Each run uses two paid OpenAI requests plus web search. The default model is configurable and must support Responses, web search, and structured outputs. API key, access, quota, lookup and drafting errors appear in the existing error modal. Tests use mock providers and an in-memory SQLite database; they do not send real emails or incur API charges.

The Node API must remain running for simulation and registration. Deploying only the static frontend does not deploy this local API.

Implementation references: [OpenAI web search](https://developers.openai.com/api/docs/guides/tools-web-search) and [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
