# Product Artifacts Review v2: Portfolio Demo Readiness

## 1. Review Context

This review evaluates the updated PRD, TDD, UX guide, UI design guide, and interview prep artifacts for the AI Gateway Simulator.

The primary objective is a demoable personal portfolio product that showcases AI infrastructure judgment to prospective interviewers. The project should be understandable in 3-5 minutes, technically defensible in a deeper interview, and scoped tightly enough to build.

## 2. Overall Assessment

The updated artifacts are materially stronger than the prior version.

Major improvements:

- The project is now clearly framed as a personal portfolio simulation.
- The title and thesis are sharper: semantic caching, routing, and cost observability.
- MVP scope is separated from future production hardening.
- The TDD now commits to a concrete stack.
- Demo controls are explicitly captured in the PRD.
- UX now includes interviewer/evaluator and demo operator personas.
- UI guidance now focuses on explainability through live traffic, badges, request details, and demo controls.
- Interview prep now includes a 3-minute script and better answers around graceful degradation and cache correctness.

The remaining gaps are mostly implementation-readiness issues. The artifacts now describe the right product, but several workflows, APIs, data contracts, and demo mechanics still need to be specified before building.

## 3. Priority Findings

### P1: Demo controls are listed, but their API and behavior are not specified

The PRD lists strong controls:

- Reset Demo
- Run Scenario
- Generate Test Traffic
- Pause / Resume Simulation
- Clear Cache
- Refresh Dashboard
- Replay Prompt
- Export Demo Report

However, the TDD only specifies `POST /v1/chat/completions`. It does not define backend endpoints or state transitions for these controls.

Why this matters:

These controls are central to the demo. If they are not designed up front, implementation can drift into manual scripts and fragile UI behavior.

Recommended TDD additions:

```text
POST /api/demo/reset
POST /api/demo/scenarios/{scenario_id}/run
POST /api/demo/traffic/start
POST /api/demo/traffic/pause
POST /api/demo/traffic/resume
POST /api/demo/cache/clear
POST /api/demo/prompts/{request_id}/replay
GET  /api/demo/report
GET  /api/metrics/overview
GET  /api/requests/live
GET  /api/requests/{request_id}
GET  /api/apps
PATCH /api/apps/{app_id}/limits
PATCH /api/settings/routing-policy
PATCH /api/settings/cache-threshold
```

Also define expected behavior for each:

- What gets cleared?
- What stays persisted?
- What happens while a scenario is already running?
- Are operations synchronous or background jobs?
- How does the UI know a scenario is complete?

### P1: Scenario definitions need to be explicit

The docs mention scenario names, but not the exact traffic patterns, prompts, expected outputs, or success criteria.

For a reliable interview demo, scenarios should be deterministic.

Recommended scenario specs:

#### Scenario 1: Semantic Cache Savings

- App: `support-bot`
- Requests: 1 cache miss followed by 3 semantically similar prompts
- Expected result: cache hit rate increases, latency drops, cost avoided increases
- Detail drawer shows similarity score above threshold

#### Scenario 2: Dynamic Routing

- App: `content-tool`
- Requests: simple classification prompt, short rewrite prompt, long analysis prompt
- Expected result: simple prompts route to cheaper model, complex prompt routes to advanced model
- Detail drawer explains routing reason

#### Scenario 3: Rate Limit Breach

- App: `rogue-app`
- Requests: burst above configured RPM
- Expected result: several `HTTP 429` rows and visible alert

#### Scenario 4: Cache Bypass

- App: `live-data-query`
- Requests: user-specific or live-data prompt
- Expected result: cache bypass reason appears even if similarity is high

This makes the demo predictable and technically defensible.

### P1: Routing policy is still underspecified

The PRD says dynamic routing is based on task type or prompt length. The TDD mentions routing savings, but does not define actual routing rules.

Recommended MVP routing rules:

```text
If prompt has cache bypass flag:
  route normally, skip cache
Else if token estimate < 250 and task_type in [classification, rewrite, faq]:
  route to cheap_fast_model
Else if token estimate >= 250 or task_type in [analysis, summarization, reasoning]:
  route to advanced_model
Else:
  route to balanced_default_model
```

Recommended request-level fields:

- `routing_policy`
- `routing_reason`
- `task_type`
- `estimated_prompt_tokens`
- `baseline_model`
- `routed_model`
- `routing_savings`

The UI guide already asks for a routing reason drawer; the TDD should define what data powers it.

### P1: Cost calculation needs units and mock pricing assumptions

The formula is now included, which is a strong improvement. The next gap is that prices and token units are not pinned down.

Recommended additions:

- Define whether prices are per 1K tokens or per 1M tokens.
- Define default mock model prices.
- Define baseline model.
- Define how output tokens are estimated for cache hits.
- Label all savings as estimated.

Example:

```text
baseline_model = "gpt-4-class"
cheap_fast_model = "gemini-flash-class"
advanced_model = "gpt-4-class"

model_prices:
  gpt-4-class:
    input_price_per_1k: 0.010
    output_price_per_1k: 0.030
  gemini-flash-class:
    input_price_per_1k: 0.00035
    output_price_per_1k: 0.00105
```

The actual numbers can be mock prices, but the docs should say so.

### P1: Data model currently mixes SQLite storage with vector-store storage

The TDD says embeddings live in a local in-memory vector store, but the `cache_entries` SQLite table includes `embedding`.

This is not necessarily wrong, but it needs a clearer split:

- SQLite stores cache metadata.
- Vector store stores embeddings and nearest-neighbor index.
- Both are connected by `cache_entry_id`.

Recommended schema split:

```text
cache_entries:
  cache_entry_id
  app_id
  prompt_hash
  response
  routed_model
  created_at
  expires_at
  estimated_input_tokens
  estimated_output_tokens
  estimated_cost

vector_index:
  cache_entry_id
  embedding
```

For an in-memory MVP, `vector_index` can be described as runtime state rebuilt from metadata on startup, or as Chroma/FAISS persisted locally.

### P2: Raw prompt storage should be intentional

The request table currently includes `prompt`. For a portfolio project, storing raw prompts is acceptable if the data is synthetic. But the docs should say that clearly.

Recommended addition:

> Because the MVP uses synthetic prompts only, raw prompts are stored for demo explainability. A production version would redact, hash, truncate, or disable prompt storage depending on policy.

This prevents a security-minded interviewer from treating raw prompt storage as an accidental oversight.

### P2: Provider health toggle appears in controls, but provider failover is out of scope

The PRD lists provider failover as a future extension, but also includes provider health toggle as an optional advanced demo control. The UI guide includes provider health indicators and toggles.

This is a small inconsistency.

Recommended resolution:

Choose one of these:

- Keep provider health as visual-only and label it as a future extension.
- Implement a lightweight simulated provider outage that forces routing to an alternate mock provider.

For demo value, a simulated provider outage is useful, but it should be clearly scoped as simulated.

### P2: OpenAI-compatible endpoint is mentioned but compatibility tier is not defined

The TDD still says `POST /v1/chat/completions` mimics OpenAI's API signature. For the portfolio MVP, that is fine, but it should explicitly say:

- Non-streaming only
- Chat completions only
- Tool calling out of scope
- Embeddings endpoint out of scope unless needed internally
- Provider responses normalized for dashboard logging

This avoids overclaiming drop-in compatibility.

### P2: Dashboard refresh behavior needs a clearer data update model

The PRD mentions refresh and auto-refresh toggles. The TDD does not define whether the dashboard uses polling, server-sent events, WebSockets, or manual refresh.

Recommended MVP:

- Poll `/api/metrics/overview` every 2 seconds while simulation is running.
- Poll `/api/requests/live` every 1 second for live request stream.
- Manual refresh triggers both endpoints immediately.
- Pause simulation pauses traffic generation, not UI refresh.

This is simple and sufficient for a demo.

### P2: Acceptance criteria should be added per MVP feature

The PRD has good portfolio success metrics, but individual features still need acceptance criteria.

Recommended examples:

- Semantic cache: replayed similar prompt returns `cache_hit=true`, similarity score, lower latency, and increased cost avoided.
- Dynamic routing: at least two request types visibly route to different models with routing reasons.
- Rate limiting: App C receives `HTTP 429` after exceeding configured RPM.
- Reset demo: clears request stream, metrics, alerts, and cache state.
- Export report: produces a summary with total requests, cache hit rate, actual spend, estimated cost avoided, and throttled request count.

### P3: UI guide should include empty, loading, error, and completed states

The UI guide now defines strong components but does not yet define operational states.

Add states for:

- Empty dashboard: ready for simulation
- Scenario running
- Scenario completed
- Scenario failed
- Loading metrics
- No requests yet
- Cache cleared
- Rate limit alert active
- Provider unavailable, if simulated

These details matter because the project is demo-driven.

## 4. Artifact-by-Artifact Recommendations

### PRD.md

Keep:

- Portfolio scope
- Demo thesis
- MVP/future split
- Demo controls
- Portfolio success metrics

Add:

- Feature-level acceptance criteria
- Scenario definitions
- Explicit statement that synthetic data is used
- Clarification that advanced controls are optional unless implemented

### TDD.md

Keep:

- Concrete stack
- Data model
- Cache eligibility rules
- Cost formulas
- Graceful degradation language

Add:

- Demo-control API endpoints
- Dashboard API endpoints
- Scenario runner design
- Routing policy rules
- Mock model pricing assumptions
- Cache metadata vs vector index split
- Dashboard polling/update strategy
- OpenAI compatibility scope

### UX_Guide.md

Keep:

- Explainability-first principle
- Interviewer/evaluator persona
- Demo operator persona
- Core demo journeys
- Simplified navigation

Add:

- Scenario lifecycle states
- Request replay journey
- Export report journey
- Cache threshold adjustment journey
- Error and recovery behavior

### UI_Design_Guide.md

Keep:

- Live request stream
- Badges
- Detail drawer
- Demo control panel
- KPI/cost display

Add:

- Empty/loading/error/completed states
- Exact badge labels
- Button hierarchy for destructive controls like Reset Demo and Clear Cache
- Report export layout
- Mobile/tablet expectations, if any

### interview_prep.md

Keep:

- Updated pitch
- 3-minute demo script
- 10-minute deep dive
- Failure handling answer
- Cache correctness answer
- Cost avoided answer

Add:

- "What I intentionally did not build" answer
- "How I would evaluate routing quality" answer
- "Why the numbers are estimates" answer
- "What is mocked vs real" answer

## 5. Recommended Build Order

1. Define mock apps, scenarios, and prompt fixtures.
2. Implement SQLite schema and reset behavior.
3. Implement gateway request logging.
4. Implement simple routing policy and routing reasons.
5. Implement semantic cache with threshold and cache reasons.
6. Implement rate limiting for App C.
7. Implement dashboard overview and live request stream.
8. Implement request detail drawer.
9. Implement scenario controls.
10. Implement export report.
11. Polish UI states and demo script.

This order keeps the backend behavior and visible dashboard tightly aligned.

## 6. Final Recommendation

The updated artifacts are now strong enough to guide a focused portfolio MVP. The remaining work is to turn high-level demo controls and product behavior into specific API contracts, deterministic scenarios, and acceptance criteria.

The next artifact update should be implementation-oriented: add scenario specs, control endpoints, routing rules, pricing assumptions, dashboard polling behavior, and feature-level acceptance criteria. That will make the project buildable without losing the strong interview narrative.
