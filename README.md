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

The bulletin workflow records every event locally and sends matching ZIP-code alerts through Resend when the API is configured. Copy `.env.example` to `.env`, then set:

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

1. One local Census crosswalk download maps counties to ZIP Code Tabulation Areas (ZCTAs). The server calls OpenAI Responses with structured output only to identify the affected counties/areas and draft the resident message; it does not make ZIP lookup web searches for each bulletin.
2. A separate model request uses the report and coverage to draft the resident email. No subscriber emails or database records are sent to OpenAI.
3. The server records one local notification per distinct ZIP, matches subscriptions across all those ZIPs, and sends each matching email one TEST message through Resend. The page shows coverage, citations, message, subscriber count, and delivery results.

County-to-ZIP lookup is approximate and can miss ZIPs or include areas outside a warning polygon; it is not a precise geospatial alerting system. Census ZCTAs approximate USPS ZIP delivery areas and can cross county lines. NWS county codes are never treated as ZIP codes. Unsupported ZIPs or failed model calls stop processing before any records or emails are created. Missing Resend settings or delivery failures leave the local event saved and show a dismissible error. Re-running a report creates a new event and may send the emails again.

Run `npm run data:download` to refresh the locally stored Census crosswalk. Each bulletin normally uses two paid OpenAI requests (county extraction and drafting) with no runtime ZIP lookup search. The default model is configurable and must support Responses and structured outputs. API key, access, quota, local mapping, and drafting errors appear in the Errors page. Tests use mock providers and an in-memory SQLite database; they do not send real emails or incur API charges.

The Node API must remain running for simulation and registration. Deploying only the static frontend does not deploy this local API.

Implementation references: [2020 Census ZCTA-to-county relationship files](https://www.census.gov/geographies/reference-files/2020/geo/relationship-files.html) and [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Trained model integration

The supplied `Exp1_BestModel.onnx` is stored at `models/Exp1_BestModel.onnx`. Its integration is server-only and disabled by default. The adapter loads it through `onnxruntime-node` and runs inference directly in Node.js. It never exposes the model to the browser and does not start a Python process.

The current adapter intentionally does not attach itself to a user-facing request yet. Your training script shows that the model expects the test dataset’s feature columns in their original order and uses `HAS_DAMAGE` as the label, but it does not include the feature names or preprocessing pipeline. Before enabling it, add the exact feature preparation for a request type, then set:

```dotenv
FLOOD_SENTRY_MODEL_ENABLED=true
FLOOD_SENTRY_MODEL_PATH=models/Exp1_BestModel.onnx
FLOOD_SENTRY_MODEL_REQUEST_TYPES=damage-risk
```

Use the internal `deriveWithTrainedModel({ requestType, features, featureNames })` function from the future request handler. The ONNX model metadata confirms one `float32` input with exactly 14 features and outputs `output_label` plus an exported probability map. The JavaScript adapter requests the scalar `output_label` because onnxruntime-node does not currently consume that map output directly. The `features` array must contain the same numeric columns, in the same order and encoding used during training. Do not enable the integration until that mapping is implemented; an arbitrary weather-bulletin vector would produce an invalid conclusion.
