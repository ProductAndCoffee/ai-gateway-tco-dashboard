# Product Artifacts Review v4: v3 Comment Resolution Check

## 1. Review Context

This review checks the current contents of `docs/product` against the comments from `Product_Artifacts_Review_v3_Portfolio_Demo.md`.

Reviewed files:

- `docs/product/PRD.md`
- `docs/product/TDD.md`
- `docs/product/UX_Guide.md`
- `docs/product/UI_Design_Guide.md`
- `docs/product/Interview_Prep.md`

The goal is to confirm whether the v3 implementation-readiness comments are resolved and identify any remaining comments before implementation starts.

## 2. Overall Assessment

The v3 review comments are mostly resolved.

The product artifacts are now implementation-ready for a first MVP build. The docs clearly define the portfolio scope, deterministic demo behavior, hybrid execution model, API surface, request lifecycle, cost math, reset behavior, report fields, UI states, and interview narrative.

Remaining comments are minor and mostly about tightening implementation contracts, not changing product direction.

## 3. v3 Resolution Status

### Resolved: Request lifecycle order

v3 comment:

The route/cache lifecycle order needed to be made unambiguous.

Current status:

Resolved in `TDD.md`.

The TDD now includes an explicit request lifecycle:

- Validate API key
- Apply rate limit
- Normalize request
- Classify task type and cache eligibility
- Perform vector lookup if eligible
- Return cached response on hit
- Route on miss or bypass
- Call selected provider/mock model
- Store response if eligible
- Log metrics

This resolves the earlier ambiguity about whether routing/classification happens before or after cache lookup.

### Resolved: Scenario prompt fixtures

v3 comment:

Scenario fixtures needed exact prompt-level definitions.

Current status:

Resolved in `PRD.md`.

The PRD now includes prompt fixtures for:

- Semantic Cache Savings
- Dynamic Routing
- Rate Limit Breach
- Cache Bypass

Each scenario includes app name, prompts or traffic pattern, task type, and expected behavior.

### Resolved: Real vs mocked provider execution

v3 comment:

The docs needed to clarify whether model responses are real, mocked, or hybrid.

Current status:

Resolved across `PRD.md`, `TDD.md`, and `Interview_Prep.md`.

The project now explicitly uses hybrid execution:

- Synthetic traffic and mock apps
- Real embeddings
- Real vector search
- Real routing logic
- Real SQLite metadata tracking
- Mocked chat completions by default
- Optional real provider calls behind an environment flag

This is the right choice for a reliable portfolio demo.

### Resolved: Cost formula token normalization

v3 comment:

The cost formula needed to divide token counts by 1,000 because prices are per 1K tokens.

Current status:

Resolved in `TDD.md`.

The TDD now defines:

```text
input_cost = (tokens_prompt / 1000) * input_price_per_1k
output_cost = (tokens_completion / 1000) * output_price_per_1k
total_cost = input_cost + output_cost
```

This fixes the highest-risk math issue from v3.

### Resolved: Reset and clear-cache semantics

v3 comment:

Reset behavior and clear-cache behavior needed to be more precise.

Current status:

Mostly resolved.

The PRD now says Reset Demo clears the request stream, metrics, alerts, cache state, and restores seeded settings. The TDD says `/api/demo/reset` clears request logs, FAISS index, metrics, and restores default seeded apps, limits, and prices. The TDD also clarifies that `/api/demo/cache/clear` purges only the vector index and cache entries table.

Remaining minor comment:

The TDD should also explicitly say whether reset restores:

- Cache threshold
- Routing policy
- Provider health state

This is not blocking, but it will prevent state drift during demos.

### Resolved: Report export contract

v3 comment:

The report export payload needed to be specified.

Current status:

Resolved in `TDD.md`.

The TDD now lists report fields:

- `scenario_run_id`
- `started_at`
- `ended_at`
- `total_requests`
- `cache_hits`
- `cache_hit_rate`
- `actual_spend`
- `estimated_baseline_spend`
- `estimated_cost_avoided`
- `routing_savings`
- `throttled_requests`
- `average_latency_ms`
- `p95_latency_ms`
- `top_apps_by_spend`

The UX and UI guides also describe the printable report modal and optional JSON download.

### Resolved: Evaluation strategy

v3 comment:

Evaluation strategy should be included in the TDD, not only interview prep.

Current status:

Resolved in `TDD.md`.

The TDD now includes unit, integration, and scenario tests:

- Cost calculation and token normalization
- Routing policy branches
- Rate limit threshold behavior
- Semantic cache miss-then-hit
- Reset clears state while restoring seed data
- Scenario tests for expected visible outcomes

### Resolved: 429 color semantics

v3 comment:

UX and UI disagreed on whether 429 throttling should be red or amber.

Current status:

Resolved.

The UX guide now says `HTTP 429` requests are highlighted in amber. The UI guide also maps `[THROTTLED - 429]` to amber and reserves red for `[FAILED - 500]`.

### Resolved: Interview closing narrative

v3 comment:

Interview prep needed a stronger closing product insight.

Current status:

Resolved in `Interview_Prep.md`.

The document now closes with:

- What this project demonstrates
- What to build next
- Why this matters for AI platform teams

This makes the interview narrative stronger.

## 4. Remaining Comments

### P2: Architecture diagram still visually skips classification

The TDD lifecycle is correct, but the Mermaid diagram still shows:

```text
FastAPI Gateway -> Cache Hit? -> Dynamic Router
```

This can imply cache lookup happens before task classification and cache eligibility.

Recommended update:

Add a classification/policy node before cache lookup:

```text
Gateway -> Auth/Rate Limit -> Classify Request -> Cache Eligible?
```

Then branch to cache lookup or router.

This is a documentation clarity issue, not a design blocker.

### P2: Scenario fixtures are good but still not fully test-contract shaped

The PRD now includes exact prompts for several scenarios, which resolves the v3 concern. For implementation, the fixtures would be stronger if represented as a table or separate `Scenario_Fixtures.md` file with columns:

- Scenario ID
- Request order
- App ID
- Prompt
- Task type
- Expected cache behavior
- Expected routed model
- Expected status code
- Expected badge

Current PRD prose is enough to build from, but a structured table would reduce ambiguity for tests.

### P2: Seed data contract is implied, not explicit

The docs reference seeded apps, default limits, prices, and settings, but do not define the full seed data set in one place.

Recommended addition:

Add a seed data table to the TDD:

- `support-bot`
- `content-tool`
- `rogue-app`
- `live-data-query`

For each app, define:

- Display name
- API key placeholder
- RPM limit
- Budget limit
- Default status

Also define default:

- Cache threshold
- Routing policy
- Provider health state
- Model prices

### P3: Advanced controls are optional in the PRD but appear in UX journeys

The PRD says advanced controls such as cache threshold slider and provider health toggle are optional extensions. The UX guide includes a journey for adjusting the cache threshold.

This is not a major issue, but the documents should label that journey as optional or future if the first MVP will not implement the slider.

Recommended update:

Either:

- Keep the threshold slider in MVP and remove “optional” from the PRD, or
- Mark the UX threshold journey as optional/future.

### P3: Provider health is visual-only, but UI mentions fallback routes

The PRD says provider failover is out of scope and the provider health toggle is visual-only for MVP. The UI guide mentions a `Provider Unavailable` state showing fallback routes.

Recommended update:

For MVP, change the UI wording to:

```text
Provider Unavailable: simulated visual state showing how a future fallback would appear.
```

This avoids implying failover is implemented.

## 5. Implementation Readiness Recommendation

The docs are ready for MVP implementation.

Before coding, make these small cleanup edits if time permits:

1. Update the TDD architecture diagram to include classification/cache eligibility before cache lookup.
2. Convert scenario fixtures into a structured table or separate fixture file.
3. Add a seed data contract for apps, prices, thresholds, routing policy, and provider health.
4. Align optional advanced controls between PRD and UX.
5. Clarify that provider unavailable/fallback UI is simulated only.

None of these remaining comments require another major product rewrite.

## 6. Final Verdict

The v3 review has been effectively resolved.

The artifacts are now focused, coherent, and buildable. They are strong enough to support a portfolio MVP that demonstrates AI infrastructure judgment through a reliable, explainable demo.
