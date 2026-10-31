# AI-Powered Civic Intelligence — Civic Sentra

Working college hackathon prototype built on the uploaded React/TypeScript + Node/Express project. Citizens report civic issues; the server assigns an assessment and explainable priority, detects same-event reports and potential recurring problems, and stores reviewer corrections separately.

**Default mode is deterministic text rules, not a trained AI model.** Optional Gemini integration analyzes text and attached images when configured. Every assessment displays its source. No city dispatch, live sensors, SMS, verified identities or field verification are connected.

## Quick start (macOS/Linux/Windows with Node installed)

Use **Node.js 22.12 or newer** (verified here with Node 24.22.1) and npm. Python, Ollama and a database service are not required.

1. Extract this ZIP and open a terminal in `ai-powered-civic-intelligence-main` (the folder containing `package.json`).
2. Install dependencies:

```sh
npm ci
```

3. Copy `.env.example` to `.env`:

```sh
cp .env.example .env
```

On PowerShell use `Copy-Item .env.example .env`. You can also duplicate/rename the file manually. Leave `AI_PROVIDER=rules` to run immediately without credentials.

4. Start **both frontend and backend together**:

```sh
npm run dev
```

Open **http://localhost:3000**. Keep the terminal running. Stop with Ctrl+C. The server binds to localhost intentionally; this is a local prototype.

### Separate terminals (optional)

```sh
# Terminal 1: Express API on 3000
npm run dev:backend
```

```sh
# Terminal 2: Vite frontend, normally 5173
npm run dev:frontend
```

Open the Vite URL it prints. `vite.config.ts` proxies `/api` to `http://127.0.0.1:3000`; change that target if you change the API port. Do not launch unified development and API-only mode together on the same port/data directory.

### Production-style local run

```sh
npm run build
npm start
```

Open http://localhost:3000. `npm run preview` is only Vite's static preview and is **not** the full application; use `npm start` for a working backend. Development tools are needed for these source-based launch scripts; use `npm ci`, not `npm ci --omit=dev`.

## Configure the optional AI provider

In `.env`:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your_private_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Create a key in [Google AI Studio](https://aistudio.google.com/apikey), with access/quota for your chosen model. Restart the server after changes. Never prefix this secret with `VITE_`; those variables are embedded in the browser bundle. Text and images leave the machine when Gemini is enabled. The provider has a 15-second request timeout; invalid JSON, invalid field values, unavailable service or missing credentials result in a clearly labeled text-rule fallback. Priority and recurrence are always calculated by server code, never trusted from a model response.

`GET /api/health` distinguishes provider configuration from the outcome of the last call. A configured key alone is not reported as a successful model connection. The fallback never claims photo inspection or dispatch. Confidence is an **uncalibrated estimate** for model output and a fixed conservative heuristic for rules; it is not an accuracy measurement.

Ollama/Flask are not required. The old independent Python implementations are inactive references in `docs/legacy/`. `triage.py` now calls the same Express endpoint; it does not maintain a second assessment implementation.

## Configure reviewer actions

Generate a private token, for example:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put its output in `.env` as `REVIEWER_TOKEN=...`, then restart the server. Open **Reviewer actions** on a report and enter that token. Authorized reviewers can correct category/severity/hazard, change status (reported → in progress → resolved), and record a reason. The token stays in the active form and is not saved to browser storage. The server preserves the original assessment and an append-only review history. Without a token configured, review actions return 503; a wrong token returns 401.

This shared token is a local prototype authorization mechanism, not production identity management.

## Optional Google Maps

Without a key, the Map tab shows the stored location list and a configuration notice; all reporting/risk/review functions work.

In `.env`:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
VITE_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
```

Enable Maps JavaScript API and the necessary billing in your Google Cloud project. Restrict the browser key to that API and the exact localhost referrers used (`http://localhost:3000/*`, `http://localhost:5173/*`). A browser Maps key is a public identifier; never use a private server credential. Replace the demo Map ID with your configured Map ID for deployment. Restart Vite/rebuild after changing `VITE_` values. The original hard-coded Maps key was removed and should be rotated/restricted before reuse.

Only incidents with valid stored coordinates get pins. Manual location names are never silently geocoded. Device-location access is requested only when the citizen clicks the location button; denial/timeouts leave manual entry available. Editing a manual address clears existing coordinates to avoid attaching the device position to a different incident location. Device accuracy is reported, not called geographic verification.

## Demonstrate the complete workflow

1. Start `npm run dev`. Confirm `/api/health` is reachable.
2. Open **Report**. Enter `Lake Road junction Chennai`, description `Deep waterlogging blocks Lake Road junction`, occurrence time **four days ago**, duration and supported impact (for example `20 residents cannot use the road`). A photo is optional; JPEG/PNG/WebP up to 5 MB is accepted. Do not choose severity/priority—those inputs do not exist in the citizen form.
3. Submit. Success appears only after the backend has saved and assessed the report. Inspect its actual source, severity, priority reasons, missing evidence and event ID.
4. Submit the same report with the same occurrence time from the same browser. It should be a probable duplicate of the same event; recurrence remains zero.
5. Submit it from a different browser/profile with the same occurrence time. It is an independent browser confirmation of that event; this does not verify a real person's identity.
6. Submit the same problem at the same location **today**. It becomes a **potential recurrence**, with one previous event. Repeating today's report must not add another recurring event.
7. Submit a streetlight failure at that location. It remains a separate issue category.
8. Submit `Open manhole with live wires on the pavement`. Inspect the urgent provisional safety priority, even when other details are missing.
9. Open **Risk** and use search/category/severity/status/recurrence filters. Resolved reports remain in the register and leave the active attention queue. Open **Map** to inspect the same records. A manually entered address has no map pin.
10. Use **Reviewer actions** with your token to correct a report and change its lifecycle status. Expand **Assessment & history** to compare the original assessment with the correction.
11. Refresh/restart the server. Reports, photos, confirmations and review history remain stored. Export CSV from Risk or backend status.

Synthetic reports used by automated tests are created in temporary isolated storage and do not populate the delivered project. A clean project starts with zero reports.

## Severity and automatic priority

Severity scale: 1 cosmetic, 2 nuisance, 3 disrupts daily life, 4 significant hazard, 5 immediate danger to life/limb. Gemini estimates it from supplied evidence; rules use documented text patterns in `backend/triage.ts`. Negated common hazard phrases are excluded, but this is a limited English heuristic. Rules never inspect images and always request review. Urgency is derived from severity: 4–5 high, 3 medium, 1–2 low.

Priority score (0–100):

```text
15 × effective severity
+ min(10, 3 × previous distinct events)
+ stated impact bonus (10 for >=100 people, 5 for >=10, otherwise 0)
+ 5 for recorded human review
- 5 if confidence <0.75 and not human reviewed
```

Normally scores below 40 are low, 40–69 medium, and 70+ high. Severity 4 gets at least high priority. Severity 5 or an immediate-hazard flag gets critical attention regardless of uncertainty. Severity 1–2 is capped at medium unless an explicit hazard flag is present. Recurrence alone cannot make a harmless report critical. Impact counts come only from explicit numbers of people/residents/commuters/students in citizen text, not invented model counts or agreement clicks; citizen claims remain unverified.

Human review changes the **effective** classification/severity/hazard and recomputes matching/priority without overwriting original model/rule output. A high score or many confirmations never makes a report verified. High severity, hazards, uncertain classifications, missing evidence and low confidence are flagged for review.

## Duplicate, confirmation and recurrence logic

Matching requires the same effective category plus description token Jaccard similarity >=0.20. `other` and `unclear` reports are not grouped automatically.

- With coordinates on both reports, use Haversine distance <=100 meters. Zero latitude/longitude is valid. Coordinates are supplied evidence, not geographic verification.
- Otherwise require an identical normalized specific address, an address term such as road/street/junction, at least three words, and the same ward. Generic city/ward names do not match. UI/evidence explicitly calls this an approximate text match.
- Compare reports within 180 days of one another. For a same-event decision, compare occurrence time to the **event anchor** (not the latest duplicate) using a 24-hour window. A chain of fresh reports cannot stretch one event window indefinitely.
- Same browser ID + same event = probable duplicate. Different browser ID + same event = independent browser confirmation. Neither creates a recurring event. Repeated agreement clicks are idempotent per browser identity and cannot confirm your own event again.
- A similar issue outside that window, or reported again after recorded resolution, is a **potential recurrence**. Related records form an event graph; recurrence count is distinct linked events minus one, never number of reports.
- Every report stores match type, event ID, linked previous report IDs, distance/text evidence and recurrence count. Review corrections rebuild matching using effective categories.

This is conservative evidence grouping, not a proven root-cause model. Continuous unresolved problems over multiple days can look recurring; different hazards within 100 meters can still be confused. GPS accuracy is not factored into the current fixed radius. Address spelling variants are intentionally not aggressively fuzzy-matched. Linked history remains in the graph; 180 days limits new comparisons, not lifetime retention of existing evidence. A future implementation should add event splitting/merging tools and verified geocoding.

## Persistence and uploads

One canonical file: `data/incidents.json` (override directory with `DATA_DIR`). A submission is stored as pending before inference; assessment, recurrence and priority are then committed. On restart interrupted pending assessments recover using disclosed text rules. Writes use a temporary file, fsync and atomic rename; a process lock prevents two servers using the directory simultaneously. Corrupted storage causes startup to fail rather than overwriting it. Back up the complete data directory while the server is stopped.

Images are base64 data URLs in the same file. The backend checks allowed MIME types, canonical base64, image signatures and 5 MB decoded size; SVG, remote URLs and filesystem paths are not accepted. This is not antivirus scanning, full image decoding, EXIF stripping or privacy redaction. Public reports may contain personal information; use synthetic examples for demos. The file store and full list responses suit small demos; use a database and object storage before larger deployment. Local filesystem loss/disk failure is not prevented by atomic writes.

## API reference

| Method/path | Behavior |
| --- | --- |
| `GET /api/health` | Real API/configuration/last-provider-call status |
| `GET /api/dashboard/stats` | Counts derived from persisted records |
| `GET /api/incidents` (`/api/reports` alias) | List; filters `category`, `severity=low/medium/high/1..5`, `status`, `search` |
| `GET /api/incidents/:id-or-reference` | One report or 404 |
| `POST /api/triage` (`/api/reports` alias) | Validates, persists, assesses and returns saved incident (201) |
| `POST /api/incidents/:id/agree` | Body `{ "reporter_id": "stable-browser-id" }`; idempotent confirmation |
| `POST /api/reports/:id/review` | Bearer reviewer token; category, severity, hazard, status and note |
| `GET /api/export.csv` | Consistent effective category/severity/priority CSV, spreadsheet-formula escaping |

Example report JSON:

```json
{
  "citizen_name": "Synthetic citizen",
  "reporter_id": "synthetic-citizen-001",
  "description": "Deep waterlogging blocks Lake Road junction",
  "location": "Lake Road junction Chennai",
  "ward": "42",
  "impact": "20 residents cannot use the road",
  "duration": "2 days"
}
```

Optional `lat`/`lng` must both be valid numbers. Optional `occurred_at` must be an ISO date with timezone within the last 180 days. Do not send `priority`, `severity`, `issue_type`, `result` or verification fields from a citizen client. Validation errors return 400, excess image/request size 413, missing resources 404, unauthorized review 401, disabled review 503, rate limiting 429, storage/internal errors 500. Mutations are limited to 60 requests/minute per connection IP. The app avoids a success message for a failed save. After a client timeout, check the incident register before retrying: the pending submission may already have been stored.

## Python compatibility

Python 3.9+ is needed only if using the optional client. No pip install needed.

```sh
# Express must already be running
python3 triage.py --description "Deep waterlogging blocks the road" --location "Lake Road junction Chennai" --duration "2 days" --impact "20 residents affected"
# With an actual local photo, put its path before the options:
python3 triage.py /path/to/photo.jpg --description "Open manhole on the pavement" --location "Lake Road junction Chennai"
```

`python3 app.py` is simply a compatibility launcher for `npm run dev`. Use a stable `--reporter-id` to simulate another browser if needed.

## Verification commands

```sh
npm ci
npm run lint
npm run build
npm test
npm run test:api
npm run test:startup
```

Optional real browser checks:

```sh
npx playwright install chromium
npm run build
npm run test:browser
```

The API/browser suites start and stop isolated servers, create only synthetic reports in temporary directories and test persistence. They do not need a Gemini key or a Maps key. Browser tests cover missing-Maps fallback, not Google billing/key authorization. Provider tests use synthetic mocked HTTP responses for success, malformed output and outage; they are **not live Gemini inference tests**. See [test report](docs/TEST_REPORT.md).

## Project notes and limits

- [Initial diagnosis](docs/INITIAL_ASSESSMENT.md), [changed files](docs/CHANGELOG.md), [test report](docs/TEST_REPORT.md).
- `evaluate.py`, `generate_scenarios.py` and `scenarios.csv` were **not present** in the upload. The old README is retained as historical reference in `docs/ORIGINAL_README.md`; its evaluation instructions and dataset claims do not describe this repaired app. There is no measured model accuracy dataset here.
- No production auth/accounts, verified person identity, municipal integration, live telemetry, SMS/push, multilingual validation, trained recurrence embeddings or accuracy calibration. Shared-token review, browser identities and English text rules are explicit prototype limitations.
- Real Gemini inference and Google Maps rendering still require external configuration and quota/network access. If unavailable, rules and the manual-location list continue to work with visible limitations.
