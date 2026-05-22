# User Experience (UX) Guide: AI Gateway Simulator

## 1. UX Principles
- **Explainability First:** The primary goal is to make backend intelligence visible. Reviewers should instantly understand *why* a decision was made.
- **Actionable Controls:** The presenter needs deterministic, one-click controls to reliably trigger interesting system behavior during the demo.
- **Clarity Over Clutter:** Present data cleanly. Avoid vanity metrics in favor of clear cost and latency indicators.

## 2. Target Personas

### Interviewer / Evaluator
- **Goal:** Understand the system quickly, see AI infrastructure behavior in real time, inspect routing/caching/cost decisions, and assess tradeoff awareness.
- **Design Implications:** Needs a prominent live request stream, visible cache hit/miss labels, request-level detail drawers, clear before/after cost and latency comparisons, and one-click scenarios.

### Demo Operator (The Presenter)
- **Goal:** Drive the demo flawlessly without manual terminal commands.
- **Design Implications:** Needs one-click scenario flows and easy reset states for the simulation.

## 3. Core Demo Journeys

### Journey 1: Empty State and Reset State
- **Trigger:** Presenter clicks "Reset Demo".
- **Experience:** All charts zero out, logs clear, and cache is purged. The dashboard explicitly states "Ready for Simulation," establishing a clean baseline for the evaluator. Seeded apps and limits are restored to defaults.

### Journey 2: Proving Semantic Cache Value (Scenario Lifecycle)
- **Trigger:** Presenter clicks "Run Scenario: Semantic Cache Savings".
- **Experience:** 
  - **Running:** UI shows a "Scenario Running" indicator.
  - The live request stream shows a "Cache Miss" with high latency and cost. A subsequent similar request shows a "Cache Hit" badge, near-zero latency, and the "Cost Avoided" counter ticks up. 
  - **Completed:** UI flags the scenario as completed. The presenter opens the "Request Detail Drawer" to show the similarity score.

### Journey 3: Request Replay & Detail Inspection
- **Trigger:** Presenter selects a previous request in the stream and clicks "Replay Prompt".
- **Experience:** The prompt is resubmitted. Because it was sent previously, it immediately hits the cache. The presenter opens the detail drawer to explain the cache hit reason, token estimates, and the routing policy applied.

### Journey 4: Exporting the Report
- **Trigger:** Presenter clicks "Export Demo Report".
- **Experience:** The system downloads a JSON summary of the session, including total requests, cache hit rate, actual spend, and estimated cost avoided.

### Journey 6: Error and Recovery Behavior
- **Trigger:** Rate limit breach scenario is run.
- **Experience:** A clear "Rate Limit Active" alert appears. The system visually highlights `HTTP 429` requests in amber. The presenter can navigate to the App settings, increase the RPM limit, and replay the prompt to show recovery.

### Journey 7: Interactive Manual Prompting
- **Trigger:** Presenter asks interviewer for a random prompt and enters it into the Manual Test Console.
- **Experience:** 
  - The UI displays a helper text: "Do not enter secrets or personal data."
  - Empty prompt inputs trigger a validation error.
  - On the first submit, the new live stream row displays a blue `[CACHE MISS]` badge.
  - On the second identical submit, the new live stream row displays a green `[CACHE HIT]` badge.
  - The detail drawer automatically slides open for the latest request to explain the routing and caching decision.

## 4. Information Architecture (Dashboard Navigation)
- **Overview (Home):** High-level KPIs and live request stream. (This is the canonical location for manual prompt demonstration and manual dashboard refresh).
- **Live Traffic:** Granular view of incoming requests.
- **Apps:** Platform controls to view/edit budgets and limits per app.
- **Settings / Demo Controls:** Dedicated panel for the presenter to reset the demo, select scenarios, and export reports.
