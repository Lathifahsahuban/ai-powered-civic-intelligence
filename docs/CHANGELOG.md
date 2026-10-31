# Repair file inventory

| File(s) | Purpose |
| --- | --- |
| `server.ts` | Repairs existing Express API, persists submission before inference, validates inputs, authenticates review, derives statistics, filters records, handles errors and serves Vite/production frontend. |
| `backend/store.ts` | New single-process atomic JSON store, fsync + rename, process lock, fail-closed corrupted-data handling. |
| `backend/triage.ts` | One canonical Gemini/text-rules assessment pipeline; validates model output, guards timeout, discloses failures and avoids invented visual observations. |
| `backend/analysis.ts` | Explainable geographic/text matching, event deduplication, recurrence graph and priority scoring. |
| `backend/validation.ts` | Shared request validation, size/type/base64/image-signature checks and rejection of citizen-assigned severity/priority. |
| `src/types.ts` | Canonical categories and contracts for incidents, provider provenance, recurrence, priority and review history. |
| `src/services/api.ts` | Same-origin API, stable browser reporter ID, timeouts, useful errors and authenticated review calls. |
| `src/App.tsx` | One fetched incident collection, consistent refresh after mutations, empty/error/loading handling, shared incident links and periodic refresh. |
| `src/components/OverviewView.tsx` | Preserves overview role/design theme; derives queue and counters from saved records. Removes fabricated telemetry/dispatch claims. |
| `src/components/ReportView.tsx` | Real validated optional image upload, manual/GPS location without false defaults, occurrence/duration/impact inputs and success only after saved API response. |
| `src/components/RiskView.tsx` | Real category counts, search/category/severity/status/recurrence filters, priority ordering and CSV download. |
| `src/components/MapView.tsx`, `GoogleMapsCanvas.tsx` | All geolocated incidents use actual stored coordinates; manual-address list and graceful absent/failed Maps configuration. Hard-coded key and fictional markers removed. |
| `src/components/IncidentCard.tsx` | Shared report details, explained priority/recurrence, links, confirmations, original assessment and reviewer correction/status form. |
| `src/components/BackendModal.tsx`, `NotificationsModal.tsx` | Truthful provider/storage state and notifications derived from reports awaiting review; existing export/settings role retained. |
| `src/components/Header.tsx`, `LiveClock.tsx` | Removes fictional ward/provider/profile indicators; fixes misleading inferred-timezone label. |
| `src/components/BottomNav.tsx`, `src/main.tsx` | Existing functional navigation and entry point preserved; explicit accessible tab labels added. |
| `src/index.css` | Original design tokens retained; replaces network-loaded icon fonts with bundled Lucide SVGs and adds responsive cards, controls, feedback and priority badges. |
| `index.html` | Updates title/metadata to describe actual prototype functionality. |
| `package.json`, `package-lock.json` | Resolves peer conflict, adds reproducible npm lock, Node requirement and working development/build/start/test commands. |
| `vite.config.ts`, `tsconfig.json` | Separate-port API proxy, native ESM config compatibility, strict TypeScript checks. |
| `scripts/start.mjs`, `scripts/backend.mjs` | Cross-platform production/API-only launchers without shell-specific environment syntax. |
| `triage.py`, `app.py`, `requirements.txt` | Standard-library API client and compatibility launcher; removes competing active Flask/Ollama state/inference engines. |
| `tests/*.test.ts`, `tests/*.integration.ts` | Logic/provider-contract and real HTTP API/restart tests with synthetic inputs. |
| `.env.example`, `.gitignore` | Credential-free configuration and ignores for runtime data, dependencies and local secrets. |
| `docs/legacy/*` | Original disconnected Python scripts, reference HTML/markdown and old Bun lock retained as inactive reference; no longer served from public assets. |
| `README.md`, `docs/*.md` | Correct local instructions, original assessment, scoring/matching design, limitations, file inventory and actual test results. |

The overall React + Express project was retained. Several screen implementations required substantial replacement because their data and displayed actions were hard-coded. Existing colors, typography, card style, header, four-tab navigation, photos, and the reporting/map/risk/review/export feature set remain. Fictional city services were replaced with explicit availability notices.
