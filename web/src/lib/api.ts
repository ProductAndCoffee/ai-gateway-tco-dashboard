const API_URL = typeof window === "undefined" 
    ? (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000") 
    : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");

export async function fetchOverview() {
    const res = await fetch(`${API_URL}/api/metrics/overview`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch overview");
    return res.json();
}

export async function fetchLiveRequests() {
    const res = await fetch(`${API_URL}/api/requests/live`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch requests");
    return res.json();
}

export async function fetchRequestDetail(id: string) {
    const res = await fetch(`${API_URL}/api/requests/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch detail");
    return res.json();
}

export async function fetchApps() {
    const res = await fetch(`${API_URL}/api/apps`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch apps");
    return res.json();
}

export async function runScenario(scenarioId: string) {
    const res = await fetch(`${API_URL}/api/demo/scenarios/${scenarioId}/run`, { 
        method: 'POST',
        cache: 'no-store' 
    });
    return res.json();
}

export async function replayPrompt(requestId: string) {
    const res = await fetch(`${API_URL}/api/demo/prompts/${requestId}/replay`, { 
        method: 'POST',
        cache: 'no-store' 
    });
    return res.json();
}

export async function resetDemo() {
    const res = await fetch(`${API_URL}/api/demo/reset`, { 
        method: 'POST',
        cache: 'no-store' 
    });
    return res.json();
}

export async function clearCache() {
    const res = await fetch(`${API_URL}/api/demo/cache/clear`, { 
        method: 'POST',
        cache: 'no-store' 
    });
    return res.json();
}

export async function exportReport() {
    const res = await fetch(`${API_URL}/api/demo/report`, { cache: 'no-store' });
    return res.json();
}

export async function patchAppLimits(appId: string, rpm_limit: number, budget_limit: number) {
    const res = await fetch(`${API_URL}/api/apps/${appId}/limits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpm_limit, budget_limit })
    });
    return res.json();
}

export async function manualPrompt(appId: string, apiKey: string, prompt: string) {
    const res = await fetch(`${API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Manual-Request': 'true'
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }]
        })
    });
    if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit exceeded");
        throw new Error("API request failed");
    }
    const data = await res.json();
    return res.headers.get("x-request-id") || data.id.replace("chatcmpl-", "");
}
