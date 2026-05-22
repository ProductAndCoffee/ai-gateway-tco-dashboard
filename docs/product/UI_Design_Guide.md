# UI and Design Guide: AI Gateway Simulator

## 1. Design Aesthetic & Theme
- **Vibe:** "Enterprise Tech meets Modern Developer Tool." Polished, prioritizing operational clarity. 
- **Theme:** Dark Mode by default.
- **Visual Language:** High contrast, monospaced fonts for technical data, clear status indicators.

## 2. Color Palette & Exact Badge Labels
- **Background:** Deep Navy/Black (`#0F172A` to `#020617`)
- **Surface/Cards:** Lighter dark (`#1E293B`)
- **Badge: `[CACHE HIT]`**: Emerald Green (`#10B981`)
- **Badge: `[CACHE MISS]`**: Electric Blue (`#3B82F6`)
- **Badge: `[CACHE BYPASS]`**: Slate Gray (`#64748B`)
- **Badge: `[ROUTED]`**: Purple (`#8B5CF6`)
- **Badge: `[THROTTLED - 429]`**: Amber (`#F59E0B`)
- **Badge: `[FAILED - 500]`**: Rose Red (`#F43F5E`)

## 3. Key UI Components (Demo Focused)

### Dashboard KPI Cards
- **Metrics Displayed:** Total Requests, Actual Spend, Cost Avoided, Cache Hit Rate.
- **Trend Indicators:** Simulated or actual comparison metrics (e.g., "% vs baseline", "+pts") to emphasize performance.

### Live Request Stream
A continuously updating table polling every 1s.
- **Columns:** Timestamp, App, Prompt Snippet, Status Badge, Similarity Score, Routed Model, Latency, Cost, Status Code.

### Request Detail Drawer (Slide-out panel)
When clicking a specific request in the live stream, a drawer slides out:
- **Full Prompt & Response Summary**
- **Routing Decision & Policy Applied** (e.g., *Rule matched: tokens < 250*)
- **Cache Decision & Similarity Score** (e.g., `0.92`)
- **Cost Calculation breakdown** (Input/Output tokens vs. Baseline)
- **Latency Breakdown**

### Manual Test Console
A dedicated input panel (either a slide-out drawer or persistent sidebar) that allows live interaction:
- **Fixed App Context Badge:** Displays `support-bot` as the MVP manual prompt context.
- **Prompt Input:** Text area for custom prompt entry with helper text: "Do not enter secrets or personal data."
- **Send Button:** Submits the prompt to the Gateway and auto-opens the Request Detail Drawer.
- **Visual States:**
  - *Empty/Error:* Send button disabled or shows validation red text.
  - *Sending:* Spinner on the send button.
  - *Submitted (Miss):* Row displays the blue `[CACHE MISS]` badge in the live stream.
  - *Submitted (Hit):* Row displays the green `[CACHE HIT]` badge in the live stream.
  - *Submitted (Bypass):* Row displays the slate `[CACHE BYPASS]` badge in the live stream.
  - *Rate Limited:* Row displays the amber `[THROTTLED - 429]` badge in the live stream.

### Demo Control Panel & Button Hierarchy
- **Primary Actions:** "Run Scenario" (Blue, solid fill).
- **Secondary Actions:** "Refresh Data" (Outline button).
- **Destructive Actions:** "Reset Demo" and "Clear Cache" (Red text or outline, clearly separated to avoid accidental clicks).

### Apps Management View
A dedicated panel or table to display the Seed Data Contract.
- **Columns:** App ID, Display name, RPM, Budget, Spend, Requests, Status.
- **Simulated Actions:** "Edit Limit".
- **Progress Bars:** Visual indicators for Budget utilization.

### Report Export Layout
- **Demo Summary:** Total Requests, Actual Spend, Estimated Savings, Cache Hit Rate.
- **Format:** The report is formatted and provided exclusively as a `.json` download.

## 4. Operational States
To handle the demo-driven nature, the UI must explicitly represent these states:
- **Empty / Ready:** "Ready for Simulation" placeholder when the request stream is empty.
- **Scenario Running:** A spinner or pulsing indicator next to the active scenario name.
- **Scenario Completed:** A green checkmark replacing the spinner.
- **Loading Metrics:** Skeleton loaders for KPI cards during the 2-second polling interval.
- **Rate Limit Alert Active:** A sticky banner at the top of the dashboard.
- **Provider Unavailable:** Simulated visual state showing how a future fallback would appear (Provider failover is not actually implemented in the MVP).

## 5. Mobile & Tablet Expectations
- **Desktop First:** This dashboard is designed for desktop/ultrawide screens for interview presentations.
- **Tablet/Mobile:** Not a priority. KPI cards will stack, but the Live Request Stream requires horizontal space and will scroll horizontally if necessary.
