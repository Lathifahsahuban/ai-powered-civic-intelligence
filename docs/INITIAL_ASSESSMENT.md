# Initial assessment (uploaded ZIP, before repairs)

## Existing functional pieces
- React/TypeScript entry point, four navigation tabs, reusable header, navigation, clock and a consistent Tailwind visual theme were present.
- Express contained health, listing/detail, submission, agreement, review and CSV routes. Gemini SDK integration was attempted from the backend.
- Report submission did call Express and handled non-OK responses; the original map had device-location permission handling.
- Python contained an independent Flask/SQLite API and Ollama client, but these were disconnected from Express.

## Broken or incomplete
- `npm install --package-lock-only --ignore-scripts` failed with ERESOLVE: Vite 8 requires newer esbuild than the directly pinned 0.25 dependency. No npm lockfile existed.
- Express reports existed only in an in-memory array. The comment calling this persistent was incorrect. The separate Python database was not the React application's source of truth.
- Stats combined a fabricated base of 1,428 reports with submitted data; categories filtered out seeded reports. Overview/map/report/notification text contained fixed severity, counts, telemetry and dispatched crews.
- Recurrence detection and automatic explained priority were absent. Agreements could be repeated without identity. Reviews were unauthenticated and did not consistently change effective classification elsewhere.
- Every new report received Velachery coordinates, including manually entered addresses. Maps used fixed demo markers and a hard-coded key rather than submitted reports.
- Rule fallbacks invented visual findings, photo agreement, confidence, dispatches and affected people. Health claimed Ollama and a database were active without checking them.
- Photo input had no frontend size validation and accepted arbitrary image-like strings server-side. Input defaults concealed missing location/impact. Reports could appear registered before submission.
- App swallowed loading errors and retained stale records when a fetch returned an empty list. Submission and agreement updated only selected counters, causing inconsistent views.
- README described a Python-only system, a `--description` CLI that did not exist, and `evaluate.py`, `generate_scenarios.py`, `scenarios.csv` that are absent. No photos dataset or accuracy measurements were supplied.
- No recurrence tests or automated API tests existed. Environment sample was absent.

## Dependencies/configuration
- Node dependencies were declared, but the esbuild/Vite peer conflict blocked a normal install. Python declared Flask/CORS/Pydantic/Ollama for a separate backend rather than the active Express app.
- Gemini needs a server-side key. Google Maps needs an optional restricted browser key. Reviewer authentication and storage settings needed to be introduced.
- No actual city telemetry, emergency dispatch, SMS, route optimization, identity verification or field verification integrations were present. These must be marked unavailable rather than simulated as real.

## Repair choice
Keep the existing React/Express structure and design tokens, replace disconnected screen data with shared saved incidents, and make Express the only state/triage owner. Python becomes a compatibility launcher and CLI client. Preserve old Python/reference files as inactive documentation under `docs/legacy/`, not public assets. Correct README rather than invent a missing evaluation dataset.
