# Product Artifacts Review v7: Manual Prompt Console Review

## 1. Review Context

This review evaluates the product artifacts after adding support for interactive manual prompts through a Manual Test Console.

Reviewed files:

- `docs/product/PRD.md`
- `docs/product/TDD.md`
- `docs/product/UX_Guide.md`
- `docs/product/UI_Design_Guide.md`
- `docs/product/Interview_Prep.md`

## 2. Overall Assessment

The Manual Test Console is an excellent addition.

It materially improves the portfolio project because it turns the demo from a scripted simulation into a live, interviewer-driven system. The new interview move is strong:

> "Give me a random prompt."

Then:

1. Submit once: visible cache miss.
2. Submit again: visible cache hit.
3. Dashboard updates cost avoided, latency, and request detail in real time.

That interaction demonstrates the core system value faster than a canned scenario. It also gives the interviewer agency, which makes the project feel more credible.

The docs are good overall. The feature is represented in PRD scope, UX journey, UI components, TDD provider behavior, and interview script. A few implementation contracts should still be tightened before coding.

## 3. What Is Working Well

### Strong product rationale

The manual console directly supports the project goal: a demoable AI infrastructure product that interviewers can understand quickly.

It is not just another control. It is the clearest proof that the gateway is a living system:

- Arbitrary input enters the same proxy flow.
- The first request creates a cacheable entry.
- The repeated request proves semantic caching and cost avoidance.
- The live stream and drawer explain the decision.

### PRD coverage is good

The PRD now includes:

- `Interactive Manual Prompting` in MVP scope.
- Acceptance criteria for sending a prompt through the proxy.
- Real-time result, routing reason, and cache visibility.

This is the right level for product scope.

### UX coverage is good

The UX guide now includes a dedicated journey:

- Presenter asks interviewer for a random prompt.
- Presenter enters it into the Manual Test Console.
- Prompt is sent to the Gateway.
- Live stream updates immediately.
- Detail drawer opens automatically.

This captures the intended demo moment well.

### UI coverage is good

The UI guide defines the Manual Test Console with:

- App selector
- Prompt input
- Send button
- Auto-opening request detail drawer

This is enough to design the component.

### Interview prep is stronger

The 3-minute script now includes the interactive prompt moment. This is a good change, but the demo is now closer to 3:30. That is fine as long as it is intentional.

## 4. Remaining Comments

### P1: Manual prompt API contract is implied, not explicit

The TDD says the Manual Test Console is supported through the existing `POST /v1/chat/completions` flow, but the dashboard-facing contract is not explicit.

Recommended TDD addition:

```text
POST /api/demo/manual-prompt
Body:
  app_id: string
  prompt: string
  force_cache_eligible?: boolean

Behavior:
  - Builds an OpenAI-compatible request internally.
  - Sends it through the same gateway lifecycle.
  - Returns request_id for detail drawer auto-open.
```

Alternative:

If the UI calls `POST /v1/chat/completions` directly, document that clearly:

```text
Manual Test Console uses the selected seeded app's API key and calls POST /v1/chat/completions directly.
```

Either approach is fine. The docs should choose one.

### P1: Repeated manual prompt cache behavior needs deterministic rules

The interview script depends on this behavior:

1. First manual submit is a cache miss.
2. Second manual submit is a cache hit.

The docs should explicitly guarantee that for exact-repeat manual prompts, assuming cache eligibility is true.

Recommended TDD rule:

```text
Manual prompts default to cache eligible unless:
  - selected app is live-data-query
  - prompt is empty
  - prompt exceeds max token limit
  - prompt contains a bypass marker

Exact repeated prompts from the same app should produce a cache hit regardless of embedding threshold.
Semantic variants use the configured similarity threshold.
```

This avoids a bad demo moment where an exact repeat somehow misses due to vector behavior.

### P1: App selector default should be specified

The UI guide includes an app selector, but the docs do not define the default app.

Recommended default:

```text
Default app: support-bot
```

Why:

- It has a generous RPM limit.
- It is safe for arbitrary prompts.
- It is already associated with FAQ-style cache behavior.

Also define that selecting `live-data-query` should show cache bypass behavior.

### P2: Manual prompt result states should be added to UI guide

The UI guide defines the input controls, but not the states.

Recommended states:

- Empty input
- Typing
- Sending
- Submitted: cache miss
- Submitted: cache hit
- Submitted: cache bypass
- Error: empty prompt
- Error: rate limited
- Error: provider unavailable or mock responder failed

For the demo, the most important visual feedback is:

- On first submit, row flashes blue `[CACHE MISS]`.
- On second submit, row flashes green `[CACHE HIT]`.
- Cost avoided counter increments.
- Detail drawer opens to the latest request.

### P2: Manual prompt should be included in test strategy

The TDD test strategy currently covers scenarios, routing, cost, rate limits, reset, and semantic cache. Add tests for the new console.

Recommended tests:

- Manual prompt first submit creates a request row.
- Manual prompt exact repeat returns cache hit.
- Manual prompt result includes `request_id`.
- Manual prompt auto-open detail endpoint returns cache/routing/cost fields.
- Empty manual prompt returns validation error.
- Manual prompt under `live-data-query` returns `[CACHE BYPASS]`.

### P2: Report export should include manual prompt activity

The report fields are good, but now that manual prompts are part of the demo, the report should distinguish scenario traffic from manual traffic.

Recommended fields:

- `manual_prompt_count`
- `scenario_request_count`
- `manual_cache_hits`
- `manual_cost_avoided`

This makes the final report reflect the live interaction.

### P2: Manual prompts create a new cache-safety discussion

The project stores synthetic prompts for demo explainability. Manual prompts are no longer fully synthetic if the interviewer types anything arbitrary.

Recommended doc note:

> Manual prompts are intended for demo-safe content only. The UI should include a small helper text: "Do not enter secrets or personal data."

This is a pragmatic safety cue and shows mature product thinking.

### P3: Demo timing should be renamed from 3-minute to 3.5-minute

The interview prep now has sections through 3:30. Rename:

```text
Recommended 3-Minute Demo Script
```

to:

```text
Recommended 3-4 Minute Demo Script
```

This is minor, but it avoids an obvious mismatch.

## 5. Recommended Product Doc Updates

### PRD.md

Add:

- Manual prompt exact-repeat acceptance criterion.
- Default app context.
- Safety note: no secrets/personal data in manual prompts.

Suggested acceptance criterion:

```text
Submitting the same manual prompt twice under the same app context produces a cache miss followed by a cache hit, updates live metrics, and opens the latest request detail drawer.
```

### TDD.md

Add:

- Manual prompt API contract or direct gateway-call decision.
- Exact-repeat cache rule.
- Manual prompt validation rules.
- Manual prompt tests.
- Report fields for manual traffic.

### UX_Guide.md

Add:

- First submit vs second submit behavior.
- Visual flash behavior.
- Error states.
- Safety helper text.

### UI_Design_Guide.md

Add:

- Manual console states.
- Latest-request auto-open behavior.
- Cache hit/miss flash treatment.
- Empty/error validation styling.

### Interview_Prep.md

Update:

- Rename 3-minute demo to 3-4 minute demo.
- Add exact words for the live interaction:

```text
"Give me a random work-style prompt. I will submit it once to create a cache miss, then submit it again to prove the cache hit path."
```

## 6. Final Recommendation

The manual console is a high-value addition and should stay in MVP scope.

The docs are good, but not quite as implementation-tight as the rest of the artifact set. The only must-fix before coding is the manual prompt request contract and exact-repeat cache behavior. Everything else can be handled during implementation.

## 7. Verdict

Strong addition. Keep it.

Readiness:

- Product concept: ready
- UX/UI direction: ready
- Technical contract: needs one small tightening pass
- Interview demo value: significantly improved
