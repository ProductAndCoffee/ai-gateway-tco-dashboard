# Product Artifacts Review v3: Implementation Readiness

## 1. Review Context

This review evaluates the latest PRD, TDD, UX guide, UI design guide, and interview prep artifacts after the v2 review comments were addressed.

The objective remains a demoable portfolio product: a focused AI Gateway Simulator that demonstrates semantic caching, model routing, rate limiting, and cost observability to interviewers.

## 2. Overall Assessment

The artifacts are now in strong shape for moving from planning to implementation.

Most v2 gaps have been resolved:

- The PRD now includes synthetic data scope, acceptance criteria, deterministic scenarios, and explicit demo controls.
- The TDD now includes API endpoints for demo controls, dashboard polling strategy, routing policy rules, mock pricing assumptions, OpenAI compatibility scope, and a clean SQLite/vector-index split.
- The UX guide now includes scenario lifecycle behavior, request replay, report export, threshold adjustment, and error recovery.
- The UI guide now includes exact badge labels, operational states, button hierarchy, and desktop-first expectations.
- The interview prep now includes answers for intentionally excluded scope, mocked vs real behavior, estimated savings, routing quality evaluation, and production hardening.

The remaining issues are not blockers for implementation, but they should be resolved before or during the first build sprint to avoid ambiguity.

## 3. Remaining Findings

### P1: The route/cache lifecycle order needs to be made unambiguous

The TDD architecture diagram shows cache hit/miss before dynamic routing, while the routing rules include a `prompt.has_cache_bypass_flag()` branch. That implies routing or request classification may need to happen before cache lookup.

This matters because cache eligibility depends on task type, risk, bypass flags, tenant/app, and possibly policy. Those cannot be evaluated after a cache lookup unless there is a pre-cache classification step.

Recommended update:

Define the request lifecycle explicitly:

```text
1. Validate API key.
2. Apply rate limit.
3. Normalize request.
4. Classify task type and cache eligibility.
5. If cache eligible, perform vector lookup.
6. If cache hit, return cached response and log cost avoided.
7. If cache miss or cache bypass, evaluate routing policy.
8. Call selected provider/mock model.
9. Store response in cache if eligible.
10. Log request and update metrics.
```

This will make the implementation and interview explanation cleaner.

### P1: Scenario prompt fixtures should be defined before coding

The PRD now defines deterministic scenarios, but the actual prompts are not yet specified.

For implementation, create a prompt fixture file or section with exact inputs:

- Scenario ID
- App ID
- Prompt text
- Task type
- Expected cache behavior
- Expected routed model
- Expected status code

Example:

```text
scenario: semantic_cache_savings
app: support-bot
requests:
  - prompt: "How do I reset my workspace password?"
    task_type: faq
    expected_cache_hit: false
    expected_model: gemini-flash-class
  - prompt: "What is the process to change my workspace password?"
    task_type: faq
    expected_cache_hit: true
    expected_model: cache
```

This makes the demo repeatable and testable.

### P1: Provider/model execution should be clarified as real, mocked, or hybrid

The TDD routes to `OpenAI API` and `Mock Cheaper Model`. Interview prep says pricing and traffic are mocked, while embeddings/FAISS/routing/SQLite are real.

The artifacts should explicitly say whether the demo will call a real LLM provider or simulate responses.

Recommended options:

- **Fully mocked model responses:** best for reliable demos and no API key dependency.
- **Hybrid:** real embeddings and mocked chat completions by default, with optional real provider mode.
- **Real provider calls:** strongest technically, but demo reliability and cost are worse.

Recommended for this project:

Use hybrid mode. Keep embeddings/vector search real, but make chat completion responses mocked by default. Add optional provider calls behind an environment flag.

### P2: Cost formula needs token unit normalization

The TDD states prices are per 1K tokens, but the formula multiplies `estimated_input_tokens * baseline_input` directly. That overstates cost unless the implementation divides by 1,000.

Recommended formula:

```text
input_cost = (input_tokens / 1000) * input_price_per_1k
output_cost = (output_tokens / 1000) * output_price_per_1k
total_cost = input_cost + output_cost
```

Then:

```text
cache_cost_avoided = baseline_cost_for_cached_request
routing_savings = baseline_model_cost - actual_routed_model_cost
```

This is a small but important correctness detail because cost is central to the demo.

### P2: Reset and clear-cache semantics should be more precise

The PRD says Reset Demo clears logs, cache, metrics, alerts, and app usage. The TDD says `/api/demo/reset` clears request logs, FAISS index, and metrics.

Clarify whether reset also restores:

- Seed apps
- API keys
- Model prices
- RPM limits
- Scenario run history
- Provider health state
- Cache threshold
- Routing policy

Recommended behavior:

- Reset demo clears requests, cache entries, vector index, alerts, and scenario run state.
- Reset demo restores seeded apps, default limits, default prices, default routing policy, default threshold, and provider health.
- Clear cache only clears cache entries and vector index.

### P2: Report export format should be specified

The PRD and UX/UI guides mention report export, but the format is not specified.

Recommended MVP:

- JSON response from `/api/demo/report`
- UI renders printable modal
- Optional download as `.json`

Report fields:

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

### P2: Evaluation strategy should be captured in the TDD, not only interview prep

The interview prep has a good answer about LLM-as-judge evaluation for routing quality. Add a short "Evaluation & Test Strategy" section to the TDD so the build has validation targets.

Recommended tests:

- Unit test cost calculation.
- Unit test routing policy for each task type.
- Unit test rate limit threshold behavior.
- Integration test semantic cache miss then hit.
- Integration test reset clears request and cache state.
- Scenario test verifies each scenario produces expected visible outcomes.

### P3: UI color semantics need one small adjustment

The UI guide says `[THROTTLED - 429]` is amber, while UX says `HTTP 429` rows are highlighted in red. Pick one.

Recommended:

- Use amber for throttled/rate-limited because it is a policy block, not a system failure.
- Use red for failed provider/gateway errors.

### P3: The interview prep could include a closing product insight

The interview prep is now useful but ends abruptly after the build-vs-buy answer. Add a short final section:

- "What this project demonstrates"
- "What I would build next"
- "Why this matters for AI platform teams"

This will help convert the demo into a memorable interview narrative.

## 4. Implementation-Go Recommendation

The artifacts are ready to drive implementation after the P1 clarifications are added:

1. Define the exact request lifecycle.
2. Create scenario prompt fixtures.
3. Clarify mocked vs real provider execution.

The P2 items can be handled during implementation, but cost unit normalization should be fixed before building the dashboard metrics.

## 5. Suggested First Build Slice

Build the smallest vertical slice that proves the architecture:

1. Seed apps, model prices, and scenario fixtures.
2. Implement `/api/demo/reset`.
3. Implement `/v1/chat/completions` with request logging.
4. Implement the routing policy and cost calculation.
5. Implement semantic cache miss/hit for Scenario 1.
6. Build Overview and Live Traffic views.
7. Add Request Detail Drawer.

Once Scenario 1 works end to end, add dynamic routing, rate limiting, replay, and export.

## 6. Final Recommendation

The product artifacts now have the right shape: focused, demoable, technically credible, and honest about portfolio scope.

The next update should be small and implementation-specific. Avoid expanding scope. Lock down lifecycle order, prompt fixtures, provider mocking strategy, and exact cost math, then start building the MVP.
