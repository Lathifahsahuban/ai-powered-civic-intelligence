# Final verification report

Verified against the repaired project on 30 October 2026. Runtime: Node.js 24.22.1, npm 11.9.0, Linux. Reports used in tests are synthetic. No real municipal service was contacted.

## Passed

| Check actually run | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Clean dependency installation succeeded after resolving esbuild/Vite conflict. |
| `npm run lint` | Strict TypeScript check passed for frontend, backend and tests. |
| `npm run build` | Vite production build passed. |
| `python3 -m py_compile app.py triage.py` | Python compatibility scripts compiled. |
| `npm test` | 13 logic/provider/storage tests passed. |
| `npm run test:api` | 22 real HTTP API checks passed against isolated Express servers. |
| `npm run test:startup` | 4 startup/client/proxy checks passed. |
| `npm run test:browser` | 13 headless Chromium browser checks passed against the built production frontend. |

### Logic/provider/storage coverage (13 tests)
- Haversine distances, including zero coordinates.
- All ten civic categories using clearly labeled text rules.
- Immediate hazards, common negation, uncertainty and harmless-recurrence priority cap.
- Duplicate reports versus independent browser confirmations.
- Distinct later events with duplicate-insensitive recurrence counts.
- Event-anchor time-window behavior.
- Different categories and distant locations kept separate.
- Conservative address-text matching with explicit limitations.
- Reviewer correction and category regrouping without overwriting original assessments.
- Citizen priority/severity rejection, input limits and spoofed image rejection.
- Model-output validation and missing-photo uncertainty.
- **Mocked** Gemini success, malformed output and network exception fallback; no real model involved.
- Exclusive storage lock, simulated disk-rename failure rollback and refusal to overwrite corrupted data.

### HTTP coverage (22 checks)
Actual server startup, truthful health, empty stats, validation and forbidden severity, invalid/oversize images, report persistence and rule provenance, duplicates, confirmations, later recurrence, repeated later-event reports, different nearby categories, image storage and critical hazards, idempotent agreements, authorized/invalid/unauthorized review, all list filters, 404s, malformed JSON, dashboard/category/register consistency, CSV, interrupted pending-assessment recovery, restart persistence and unconfigured-Gemini fallback.

### Startup coverage (4 checks)
Unified Express+Vite development server serves the actual transformed React entry; Python standard-library client submits through Express; separate Vite frontend proxies to API with consistent records; production launcher serves built HTML and persisted API data.

### Browser coverage (13 checks)
Production page renders empty state; citizen form has no priority/severity selector; actual JPEG upload and report submission; displayed automatic hazard priority and rule provenance; missing Maps configuration and manual-address details; risk search; authorized review and lifecycle change preserving original assessment; own confirmation cannot inflate count; frontend reload preserves review; 390px mobile reporting/dashboard fit viewport; synthetic 500 save failure displays an error with no success message; no uncaught browser JavaScript errors in the tested flow.

Browser checks used a locally provisioned headless Chromium binary because the standard Playwright browser download was incomplete in this environment. All browser interactions still used Playwright against the real application. External fonts were blocked deliberately to check operation without them. Screenshot review identified reliance on online icon fonts; active navigation/header/clock now use bundled SVG icons. Internal QA screenshots were inspected but are not packaged as user deliverables.

## Failed / unresolved

No unresolved failures in the final executed application checks above. Preliminary checks exposed and led to fixes for the dependency peer conflict, tsx CLI IPC startup issue, navigation accessible names and offline icon rendering. A browser test's case-sensitive assertion was corrected to match CSS-uppercase text. Browser provisioning problems were resolved with a local binary; these were test-environment setup problems, not successful application tests.

## Not run / not verified

- Real Gemini text/vision inference with a valid key and quota; model accuracy, calibration, regional-language handling and resistance to adversarial report text.
- Real Google Maps rendering with a configured key, billing/referrer restrictions and Map ID.
- Real device GPS accuracy, physical-device permission UX and reverse-geocoding (not implemented).
- Real municipal dispatch, sensors, SMS/push or verified identity (not implemented).
- Production load/concurrency/security auditing, antivirus/full image decoding, disk-failure recovery and deployment to external hosting.
- Original README's dataset evaluation: `evaluate.py`, `generate_scenarios.py`, `scenarios.csv` were absent. No accuracy figures were fabricated.

## External configuration still required

- `GEMINI_API_KEY` and `AI_PROVIDER=gemini` for genuine model inference.
- Restricted `VITE_GOOGLE_MAPS_API_KEY`, Google billing/API enablement and optional production Map ID for the optional map canvas.
- Private `REVIEWER_TOKEN` for review corrections/status updates.
- Durable/backed-up `DATA_DIR` and production authentication/database/object storage if the prototype moves beyond local demonstration.

## Reproduce

```sh
npm ci
npm run lint
npm run build
npm test
npm run test:api
npm run test:startup
npx playwright install chromium
npm run test:browser
```

Then copy `.env.example` to `.env`, configure optional settings, run `npm run dev` and open http://localhost:3000. API and browser suites use temporary storage and stop their child servers automatically.
