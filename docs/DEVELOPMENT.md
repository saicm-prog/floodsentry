# FloodSentry — developer guide

For the project overview and judge walkthrough, start with the [main README](../README.md).

Use **FloodSentry** as one word in the app, page titles, email sender names, confirmations, and alerts. Existing sender mailboxes and technical filenames stay unchanged. Startup updates the product name in saved notification messages without changing registration details or report timestamps.

A React + Vite + TypeScript app that explains storms and turns weather bulletins into local alerts.

## Interface

The homepage uses navy and sky blue. Forms use soft-white panels with dark text. Every page uses DM Sans.

The text follows Simplified Technical English principles, without claiming formal ASD-STE100 compliance. Plain-language summaries appear first. Expandable sections hold technical details.

Bulletin results copy WMO, AWIPS, UGC, and VTEC identifiers from the supplied report. Missing identifiers stay absent. The app links NWSI 10-1701 and 10-1703 for format details.

Routes: `/`, `/learn`, `/register`, `/registrations`, `/bulletin`, and `/errors`. The `/simulate` alias still works. The hidden account, safety, and introduction components remain available in `src/pages/`.

## Weather guide

`/learn` is a public, static learning page linked from the main navigation and homepage storm section.
Ten chapters explain weather basics, floods, thunderstorms, tornadoes, hurricanes, winter storms,
temperature extremes, wind and visibility, drought and smoke, and emergency planning.
The guide contains about 4,200 words, with short sentences and everyday definitions.
Each chapter covers causes, impacts, practical actions, and links to official sources.
Optional science sections give more detail after the basic explanation.

Content is in `src/data/weatherGuide.ts`. Original SVG illustrations and their text descriptions are
in `src/components/WeatherIllustration.tsx`. The guide uses the existing font and blue palette.
It supports keyboard navigation, direct chapter links, a responsive contents menu, and printing.
Print styles start each chapter on a new page and include the expanded science text.
This page needs no account, API, or database connection. Sources were checked October 19, 2026.

## Commands

```bash
npm install
npm run dev
npm run dev:api
npm run build
npm test
```

The production output is generated in `dist/`. Configure the hosting provider to build from the `main` branch with `npm run build` and publish `dist`.

## Email validation

Email fields use the shared `validateEmail()` and `isValidEmail()` functions in `src/emailValidation.ts`.
The browser and API check the same ASCII mailbox rules, including @, spaces, dots, domain labels, and length limits.
The app trims surrounding spaces and keeps its existing lowercase email storage. It preserves plus tags and dots.
Field feedback appears after leaving the field or trying to submit. Invalid formats cannot be saved.

New registrations also require an emailed confirmation code sent through Resend. `POST /api/subscriptions`
creates a pending request and returns HTTP 202; it does not add an active subscription. The user enters the
six-digit code in `POST /api/subscriptions/confirm`. Only a valid code creates an active subscription.
Provider rejection, incorrect codes, expired codes, or failure to confirm never activate an address.
Email providers do not offer a reliable instant check for every mailbox; receiving and entering a code
confirms that the user can access the address. Resend acceptance alone is not verification.

Pending requests live in `subscription_verifications` in the existing local SQLite database.
Only hashed codes are stored. Codes expire after 10 minutes and allow five incorrect attempts.
Resends have a one-minute cooldown and a five-request hourly limit per address. New registrations save
`verified_at`; existing registrations remain unchanged with a null confirmation time.
The confirmation email uses the configured Resend sender and goes to the registering address, independently
of the bulletin simulator's dedicated test inbox. `.env` needs `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

Email format references: [HTML email inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/email) and [SMTP limits](https://datatracker.ietf.org/doc/html/rfc5321#section-4.5.3.1).

## Removing a registration

Both registration pages have a collapsed “Remove your registration” option at the bottom.
It asks for the registered email and ZIP code, then shows a confirmation before deletion.
`DELETE /api/subscriptions` accepts `{ email, zipCode, confirmRemoval: true }` and removes only an exact match.
The directory refreshes after removal. Saved bulletins and account records are unchanged.
This local prototype does not verify email ownership. Add verified, signed unsubscribe links before public deployment.

## Resend local alerts

The website and email headers use the Wave Shield mark. The source is `public/flood-sentry-wave-shield.svg`.
The email uses a navy-backed, 3× PNG export attached with a Content-ID. It does not load images from localhost.
The wordmark stays live text if an email client blocks images. Both email templates live in `server/email-templates.mjs`.
Browser icons use the same shield shapes. Keep the PNG exports in `public/` when deploying the API.

Run `npm run email:preview` for an offline email preview at `output/email-preview/index.html`. This command sends nothing.

The bulletin workflow saves events locally and counts matching registrations. It sends one email to the existing project test inbox, not to subscribers. Copy `.env.example` to `.env`, then set:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="FloodSentry <alerts@your-verified-domain.example>"
```

The sender address must be a verified Resend domain or the Resend-provided testing sender. Keep `.env` private; it is ignored by Git. Start the API with `npm run dev:api` before using `/simulate`.

## Weather bulletin simulator

Add these server-only settings to the project-root `.env` alongside the Resend settings:

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1
```

Restart `npm run dev:api` after changing `.env`, or use `npm run dev:all` to start both services. Never prefix these secrets with `VITE_`.

The `/bulletin` page has one multiline weather-report input. “Load sample” inserts the historical June 10, 2012 Tennessee example. It does not send anything. Submitting sends `POST /api/weather-bulletins` with `{ "weatherReport": "..." }`:

1. One local Census crosswalk download maps counties to ZIP Code Tabulation Areas (ZCTAs). The server calls OpenAI Responses with structured output only to identify the affected counties/areas and draft the resident message; it does not make ZIP lookup web searches for each bulletin.
2. A separate model request uses the report, coverage, and relevant safety guidance from the weather guide to draft the resident email. It includes one or two plain-language damage paragraphs and three to eight protective action items. Possible impacts are not presented as confirmed damage. No subscriber emails or database records are sent to OpenAI.
3. A third request uses OpenAI web search for current shelter and help locations in the affected counties. It accepts only government, Red Cross, and 211 sources retrieved by the search. The server checks each name, address, service, and optional phone against the source page. It never claims a facility is open, has capacity, or is closest to a resident. Each listing includes its source and check time. If verification fails, the report gives an explicit notice plus Red Cross and 211 resources. Help-lookup failures do not block the main report.
4. The server saves one notification per ZIP and counts matching subscriptions. Saved messages, HTML emails, plain-text emails, and the results preview include the damage, actions, and local-help sections. Resend receives one email for the project test inbox. Technical details follow the plain-language sections. Email acceptance does not confirm inbox delivery.

County-to-ZIP lookup is approximate and can miss ZIPs or include areas outside a warning polygon; it is not a precise geospatial alerting system. Census ZCTAs approximate USPS ZIP delivery areas and can cross county lines. NWS county codes are never treated as ZIP codes. Unsupported ZIPs or failed extraction/drafting calls stop processing before any records or emails are created. Missing Resend settings or delivery failures leave the local event saved and show a dismissible error. Re-running a report creates a new event and may send the emails again. Local-help lookups use the current date, even for historical bulletins. Listings are not proof of shelter activation or a safe travel route; residents must confirm opening, capacity, accessibility, and pet arrangements.

Run `npm run data:download` to refresh the locally stored Census crosswalk. Each bulletin normally uses three paid OpenAI requests: county extraction, drafting, and a web-search-enabled local-help lookup. ZIP matching still stays local. No extra API key is needed. The default model is configurable and must support Responses, structured outputs, and web search. API key, access, quota, local mapping, and drafting errors appear in the Errors page. Tests use mock providers and an in-memory SQLite database; they do not send real emails or incur API charges.

The Node API must remain running for simulation and registration. Deploying only the static frontend does not deploy this local API.

Implementation references: [2020 Census ZCTA-to-county relationship files](https://www.census.gov/geographies/reference-files/2020/geo/relationship-files.html), [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), and [OpenAI web search](https://developers.openai.com/api/docs/guides/tools-web-search).

## Trained model integration

The supplied `Exp1_BestModel.onnx` is stored at `models/Exp1_BestModel.onnx`. Its integration is server-only and disabled by default. The adapter loads it through `onnxruntime-node` and runs inference directly in Node.js. It never exposes the model to the browser and does not start a Python process.

The current adapter intentionally does not attach itself to a user-facing request yet. Your training script shows that the model expects the test dataset’s feature columns in their original order and uses `HAS_DAMAGE` as the label, but it does not include the feature names or preprocessing pipeline. Before enabling it, add the exact feature preparation for a request type, then set:

```dotenv
FLOOD_SENTRY_MODEL_ENABLED=true
FLOOD_SENTRY_MODEL_PATH=models/Exp1_BestModel.onnx
FLOOD_SENTRY_MODEL_REQUEST_TYPES=damage-risk
```

Use the internal `deriveWithTrainedModel({ requestType, features, featureNames })` function from the future request handler. The ONNX model metadata confirms one `float32` input with exactly 14 features and outputs `output_label` plus an exported probability map. The JavaScript adapter requests the scalar `output_label` because onnxruntime-node does not currently consume that map output directly. The `features` array must contain the same numeric columns, in the same order and encoding used during training. Do not enable the integration until that mapping is implemented; an arbitrary weather-bulletin vector would produce an invalid conclusion.
