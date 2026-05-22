import httpx
import asyncio
import os

API_URL = os.getenv("GATEWAY_API_URL", "http://127.0.0.1:8000")

SCENARIOS = {
    "scenario_1": {
        "name": "Semantic Cache Savings",
        "description": "Shows cache miss then hit for FAQ prompt.",
        "app_id": "support-bot",
        "api_key": "key_1",
        "requests": [
            {"prompt": "How do I reset my workspace password?", "delay_after": 2.0},
            {"prompt": "What is the process to change my workspace password?", "delay_after": 0.0}
        ]
    },
    "scenario_2": {
        "name": "Dynamic Routing",
        "description": "Shows routing to different models based on complexity.",
        "app_id": "content-tool",
        "api_key": "key_2",
        "requests": [
            {"prompt": "Categorize this text into one of three buckets: The quick brown fox jumps over the lazy dog.", "delay_after": 2.0},
            {"prompt": "Analyze the following 10-page financial report and infer the strategic shift of the company: [simulated 10 page text padding] " * 50, "delay_after": 0.0}
        ]
    },
    "scenario_3": {
        "name": "Rate Limit Breach",
        "description": "Triggers 429 Too Many Requests.",
        "app_id": "rogue-app",
        "api_key": "key_3",
        "requests": [{"prompt": "Generate a short greeting.", "delay_after": 0.1} for _ in range(12)] # Limit is 10
    },
    "scenario_4": {
        "name": "Cache Bypass",
        "description": "Live data query bypassing cache.",
        "app_id": "live-data-query",
        "api_key": "key_4",
        "requests": [
            {"prompt": "Fetch the latest real-time stock price for AAPL", "delay_after": 0.0}
        ]
    }
}

async def run_scenario_background(scenario_id: str):
    """Executes a predefined scenario asynchronously."""
    scenario = SCENARIOS.get(scenario_id)
    if not scenario:
        return
        
    headers = {
        "Authorization": f"Bearer {scenario['api_key']}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        for req in scenario['requests']:
            payload = {
                "model": "gpt-4",
                "messages": [{"role": "user", "content": req['prompt']}]
            }
            try:
                await client.post(f"{API_URL}/v1/chat/completions", json=payload, headers=headers)
            except Exception as e:
                print(f"Scenario Request Failed: {e}")
            
            if req['delay_after'] > 0:
                await asyncio.sleep(req['delay_after'])

# Raw keys for demo internal use
DEMO_RAW_KEYS = {
    "support-bot": "key_1",
    "content-tool": "key_2",
    "rogue-app": "key_3",
    "live-data-query": "key_4"
}

async def replay_request_background(app_id: str, prompt: str):
    """Replays a specific prompt."""
    raw_key = DEMO_RAW_KEYS.get(app_id)
    if not raw_key:
        print(f"Cannot replay prompt. No raw key mapping for app {app_id}")
        return
        
    headers = {
        "Authorization": f"Bearer {raw_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4",
        "messages": [{"role": "user", "content": prompt}]
    }
    async with httpx.AsyncClient() as client:
        try:
            await client.post(f"{API_URL}/v1/chat/completions", json=payload, headers=headers)
        except Exception as e:
            print(f"Replay Request Failed: {e}")
