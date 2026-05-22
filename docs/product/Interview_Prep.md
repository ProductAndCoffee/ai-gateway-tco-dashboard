# AI Gateway Simulator: Project Overview and Interview Prep

This document synthesizes the strategic, technical, and interview preparation details for the AI Gateway Simulator portfolio project.

## 1. Why is this needed? Who will use this?

### The Problem
When a company first starts experimenting with AI, they usually have one or two teams connecting directly to an API. As the company scales, chaos ensues without centralized infrastructure.
1. **The Cost Explosion (TCO):** Developers default to the smartest, most expensive model.
2. **Redundancy:** Paying multiple times for the exact same query without a caching mechanism.
3. **Lack of Observability:** No centralized way to track API costs, rate limits, and latency across different product teams.

### The Pitch
*"Most PMs focus on building AI features. For my portfolio, I built a simulation of the infrastructure required to scale those features across an enterprise. I built an AI Gateway Simulator that demonstrates semantic caching and dynamic model routing. By centralizing AI traffic, making routing and cache decisions visible, and quantifying cost/latency tradeoffs, we can solve unit economics at scale."*

---

## 2. The Portfolio Demo Scope
This is a personal project and simulation, not a deployed enterprise gateway. The project uses mock apps and synthetic traffic to demonstrate realistic platform behavior. 

### Recommended 3-4 Minute Demo Script

**0:00-0:30: Setup**
Open the dashboard in a clean state.
*Say:* "This is a simulated AI gateway that sits between internal apps and LLM providers. It demonstrates semantic caching, dynamic routing, rate limiting, and cost observability."

**0:30-1:15: Semantic caching**
Run the semantic cache scenario.
*Show:* First request is a cache miss. Similar second request is a cache hit. Latency drops. Cost avoided increases.

**1:15-2:00: Dynamic routing**
Run the routing scenario.
*Show:* Simple prompts route to cheaper model. Complex prompts route to stronger model. Dashboard explains routing reason. Cost comparison updates.

**2:00-2:30: Rate limiting**
Run the noisy app scenario.
*Show:* App C exceeds quota. Gateway returns HTTP 429. Alert appears in dashboard.

**2:30-3:00: Interactive Manual Prompting**
*Say:* "Give me a random work-style prompt. I will submit it once to create a cache miss, then submit it again to prove the cache hit path." Type it into the Manual Test Console.
*Show:* First attempt is a cache miss. Submit the exact prompt again to show an instant cache hit and cost avoided incrementing. 

**3:00-3:30: Wrap**
Show the final metrics.
*Say:* "The goal is not to recreate a full enterprise gateway, but to prove the core infrastructure pattern: centralize AI traffic, make routing and cache decisions visible, and quantify cost/latency tradeoffs."

---

## 3. The 10-Minute Deep Dive Script (Technical Follow-up)
Use this for technical interview follow-ups:
1. Explain the architecture (FastAPI, SQLite for metadata, FAISS for vector index, Next.js).
2. Walk through a single request lifecycle from prompt to cache check to routing.
3. Explain semantic cache threshold (precision vs recall) and tenant partitioning.
4. Explain the routing policy.
5. Explain the cost calculation (`actual vs projected baseline`).
6. Discuss rate limiting and quotas.
7. Discuss production hardening.
8. Discuss build-vs-buy tradeoffs.
9. Discuss evaluation and correctness risks.
10. Show code structure.

---

## 4. Simulated Interview Questions (Principal Level)

### Technical Tradeoffs & Boundaries

**Q: "What did you intentionally NOT build for this project?"**
**Answer:** "Because this is a portfolio simulation, I intentionally excluded real enterprise authentication, distributed rate-limiting via Redis, and complex RBAC. I also explicitly scoped the OpenAI-compatible endpoint to only handle non-streaming chat completions. My focus was on proving the core routing, caching, and observability logic, rather than building boilerplate enterprise scaffolding."

**Q: "What parts of this are mocked versus real?"**
**Answer:** "The traffic generation, client apps, and token pricing are all mocked/synthetic. However, the core logic—generating embeddings via SentenceTransformers, searching the FAISS index, evaluating the routing policy, and tracking the SQLite metadata—is fully real and executed live during the simulation. I use a 'Hybrid' mode where chat completion responses are mocked for demo speed and reliability, but real API calls can be toggled via a flag."

**Q: "Why are the savings numbers labeled as 'estimates'?"**
**Answer:** "Because we rely on proxy routing, we often route to a cheaper model (like Gemini Flash) instead of the baseline (GPT-4). We don't definitively know how many output tokens the baseline model *would* have generated. Therefore, cost avoided and routing savings must be calculated using realistic estimates based on the actual output token count of the model that served the request."

### Reliability & Architecture

**Q: "What happens if a provider is down or the gateway fails?"**
**Answer:** "The gateway **fails closed** for auth, quota, and safety controls to ensure no budget overruns. It **degrades gracefully** for cache and advanced routing. If the cache is unavailable, requests continue through normal provider routing. If the routing policy engine fails, the gateway uses a conservative baseline default route."

**Q: "Semantic caching sounds great until data changes. How do you handle cache correctness and invalidation?"**
**Answer:** "We only cache deterministic or low-risk request types. Cache entries must be tightly partitioned by app/team. We use a configurable similarity threshold (e.g., 0.90) and implement strict Time-To-Live (TTL) rules based on the endpoint. We also bypass the cache entirely for live data, user-specific data, or high-risk workflows."

**Q: "How would you evaluate if your dynamic routing is causing a drop in response quality?"**
**Answer:** "Quality evaluation is critical. I would implement an offline LLM-as-a-judge evaluation pipeline. A sample of prompts routed to the cheaper model would be re-run against the advanced baseline model offline. We would then use a strong judge model (like GPT-4) to compare the outputs. If the cheaper model's win-rate drops below a defined threshold, we adjust the routing policy."

### Strategy & Product

**Q: "Why build this instead of using Cloudflare AI Gateway, Portkey, or Helicone?"**
**Answer:** "I advocate for a hybrid 'Buy and Integrate' strategy. We should buy the commodity core routing layer to save engineering months. We spend our engineering effort on the integration layer and internal Dashboard—building custom logic that ties API logs to our specific Active Directory, internal squad budgets, and custom routing policies."

---

## 5. Closing Product Insight

Wrap up the interview discussion with these strategic takeaways:
- **What this project demonstrates:** "It shows that I can balance deep AI technical patterns (vector search, embeddings, dynamic routing) with pragmatic product execution (clear observability, measurable cost outcomes)."
- **What I would build next:** "If this were a real enterprise product, I would focus entirely on Developer Experience (DevEx)—building self-serve SDKs and robust alerting so teams migrate to the Gateway organically without top-down mandates."
- **Why this matters for AI platform teams:** "AI is no longer just about prompt engineering; it's about unit economics. As usage scales from 1,000 to 1,000,000 requests a day, the difference between a direct API call and a cached/routed API call is the difference between a profitable product and an unsustainable burn rate."
