from fastapi import FastAPI, Depends, HTTPException, Header, Request, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
import uuid
import random
import hashlib

from db import get_connection, reset_demo
import vector
import router
import scenarios

app = FastAPI(title="AI Gateway Simulator")

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Request-Id", "X-Manual-Request"],
    expose_headers=["X-Request-Id"],
)

# Global setting for threshold (adjustable via API)
CACHE_SIMILARITY_THRESHOLD = 0.90

# Pydantic models for OpenAI compatibility
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = "gpt-4" # Default requested model
    messages: List[ChatMessage]
    temperature: Optional[float] = 1.0

class AppLimitUpdate(BaseModel):
    rpm_limit: int
    budget_limit: float

# Dependencies
def get_app_context(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    raw_api_key = authorization.split(" ")[1]
    api_key_hash = hashlib.sha256(raw_api_key.encode()).hexdigest()
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM apps WHERE api_key = ?", (api_key_hash,))
    app_row = cursor.fetchone()
    conn.close()
    
    if not app_row:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return dict(app_row)

def check_rate_limit(app_context: dict, is_manual: bool):
    # Rolling 60 second window rate limit
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM requests WHERE app_id = ? AND timestamp >= datetime('now', '-1 minute')", (app_context['app_id'],))
    row = cursor.fetchone()
    conn.close()
    
    if row['count'] >= app_context['rpm_limit']:
        # Record the throttled request before raising 429
        record_throttled_request(app_context['app_id'], is_manual)
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

def record_throttled_request(app_id: str, is_manual: bool):
    conn = get_connection()
    cursor = conn.cursor()
    request_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO requests (
            request_id, app_id, prompt, routing_policy, routing_reason, task_type,
            estimated_prompt_tokens, baseline_model, routed_model, cache_hit,
            similarity_score, tokens_prompt, tokens_completion, cost, latency, status_code, routing_savings, is_manual
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        request_id, app_id, "[THROTTLED REQUEST]", "N/A", "Rate limit breached", "N/A",
        0, router.BASELINE_MODEL, "none", False, 0.0, 0, 0, 0.0, 3, 429, 0.0, is_manual
    ))
    conn.commit()
    conn.close()

# OpenAI Compatible Endpoint
@app.post("/v1/chat/completions")
async def chat_completions(
    req: ChatCompletionRequest, 
    response: Response,
    request: Request,
    app_context: dict = Depends(get_app_context)
):
    start_time = time.time()
    request_id = str(uuid.uuid4())
    response.headers["X-Request-Id"] = request_id
    
    is_manual = request.headers.get("X-Manual-Request") == "true"
    
    # 2. Apply Rate Limit
    check_rate_limit(app_context, is_manual)
    
    # 3. Normalize Request
    prompt = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    if not prompt:
        raise HTTPException(status_code=400, detail="No user message found")

    prompt_hash = hashlib.sha256(prompt.encode('utf-8')).hexdigest()

    # 4. Classify and Estimate Tokens
    task_type = router.classify_task_type(prompt, app_context['app_id'])
    estimated_prompt_tokens = router.estimate_tokens(prompt)
    
    cache_eligible = True
    if task_type == "live-data" or estimated_prompt_tokens > 1000:
        cache_eligible = False

    cache_hit = False
    similarity_score = 0.0
    routed_model = "none"
    routing_reason = ""
    mock_response_text = ""
    tokens_prompt = estimated_prompt_tokens
    tokens_completion = 0
    
    # 5 & 6. Cache Lookup (Exact match first, then Vector)
    if cache_eligible:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Exact match
        cursor.execute("SELECT * FROM cache_entries WHERE app_id = ? AND prompt_hash = ?", (app_context['app_id'], prompt_hash))
        exact_match = cursor.fetchone()
        
        if exact_match:
            cache_hit = True
            similarity_score = 1.0
            mock_response_text = exact_match['response']
            routed_model = "cache"
            routing_reason = "Matched cache entry exactly."
            tokens_completion = exact_match['estimated_output_tokens']
        else:
            # Semantic search fallback
            hit = vector.search_cache(app_context['app_id'], prompt, CACHE_SIMILARITY_THRESHOLD)
            if hit:
                cursor.execute("SELECT * FROM cache_entries WHERE cache_entry_id = ?", (hit['cache_entry_id'],))
                cache_row = cursor.fetchone()
                if cache_row:
                    cache_hit = True
                    similarity_score = hit['similarity_score']
                    mock_response_text = cache_row['response']
                    routed_model = "cache"
                    routing_reason = f"Matched cache entry. Similarity: {similarity_score:.2f}"
                    tokens_completion = cache_row['estimated_output_tokens']
        conn.close()

    # 7 & 8. Route and Call Provider
    if not cache_hit:
        routed_model, routing_reason = router.determine_route(prompt, task_type, estimated_prompt_tokens)
        
        time.sleep(random.uniform(0.3, 1.5)) 
        
        mock_response_text = f"Simulated response from {routed_model}. Context: {prompt[:50]}..."
        tokens_completion = router.estimate_tokens(mock_response_text)
        
        # 9. Store in Cache
        if cache_eligible:
            cache_entry_id = str(uuid.uuid4())
            vector.add_to_index(cache_entry_id, app_context['app_id'], prompt)
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO cache_entries (
                    cache_entry_id, app_id, prompt_hash, response, routed_model,
                    estimated_input_tokens, estimated_output_tokens
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                cache_entry_id, app_context['app_id'], prompt_hash, mock_response_text,
                routed_model, tokens_prompt, tokens_completion
            ))
            conn.commit()
            conn.close()

    actual_cost, cache_avoided, routing_sav = router.calculate_savings(routed_model, tokens_prompt, tokens_completion, cache_hit)
    latency_ms = int((time.time() - start_time) * 1000)
    
    if not cache_eligible and not cache_hit:
        if task_type == "live-data":
            routed_model = f"bypass:{routed_model}"

    # 10. Log Request
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO requests (
            request_id, app_id, prompt, routing_policy, routing_reason, task_type,
            estimated_prompt_tokens, baseline_model, routed_model, cache_hit,
            similarity_score, tokens_prompt, tokens_completion, cost, latency, status_code, routing_savings, is_manual
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        request_id, app_context['app_id'], prompt, "balanced", routing_reason, task_type,
        estimated_prompt_tokens, router.BASELINE_MODEL, routed_model, cache_hit,
        similarity_score, tokens_prompt, tokens_completion, actual_cost, latency_ms, 200, routing_sav, is_manual
    ))
    conn.commit()
    conn.close()

    return {
        "id": f"chatcmpl-{request_id}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": routed_model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": mock_response_text
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": tokens_prompt,
            "completion_tokens": tokens_completion,
            "total_tokens": tokens_prompt + tokens_completion
        }
    }

# ==========================================
# DASHBOARD APIS
# ==========================================

@app.get("/api/metrics/overview")
def get_metrics_overview():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total FROM requests")
    total_reqs = cursor.fetchone()['total']
    
    cursor.execute("SELECT COUNT(*) as hits FROM requests WHERE cache_hit = 1")
    cache_hits = cursor.fetchone()['hits']
    
    cursor.execute("SELECT SUM(cost) as total_spend FROM requests")
    total_spend = cursor.fetchone()['total_spend'] or 0.0
    
    cursor.execute("SELECT SUM(routing_savings) as sav FROM requests")
    routing_sav = cursor.fetchone()['sav'] or 0.0
    
    cursor.execute("SELECT SUM(tokens_prompt) as in_tkns, SUM(tokens_completion) as out_tkns FROM requests WHERE cache_hit = 1")
    row = cursor.fetchone()
    cache_in = row['in_tkns'] or 0
    cache_out = row['out_tkns'] or 0
    cache_avoided = router.calculate_cost(router.BASELINE_MODEL, cache_in, cache_out)
    
    total_avoided = routing_sav + cache_avoided
    hit_rate = (cache_hits / total_reqs * 100) if total_reqs > 0 else 0
    
    cursor.execute("SELECT latency, cache_hit FROM requests WHERE status_code = 200 ORDER BY timestamp DESC LIMIT 20")
    latencies = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_requests": total_reqs,
        "actual_spend": total_spend,
        "cost_avoided": total_avoided,
        "cache_hit_rate": hit_rate,
        "latency_data": list(reversed(latencies))
    }

@app.get("/api/requests/live")
def get_live_requests():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT request_id as id, timestamp as time, app_id as app, prompt, 
               cache_hit, routed_model, status_code, similarity_score, latency, cost 
        FROM requests 
        ORDER BY timestamp DESC LIMIT 50
    ''')
    reqs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    for r in reqs:
        r['time'] = r['time'].split(' ')[1]
        
        if r['status_code'] == 429:
            r['status'] = "THROTTLED - 429"
        elif r['status_code'] >= 500:
            r['status'] = "FAILED - 500"
        elif r['routed_model'].startswith("bypass:"):
            r['status'] = "CACHE BYPASS"
            r['routed_model'] = r['routed_model'].split(":")[1]
        elif r['cache_hit']:
            r['status'] = "CACHE HIT"
        else:
            if r['routed_model'] == router.BASELINE_MODEL:
                r['status'] = "CACHE MISS"
            else:
                r['status'] = "ROUTED"
                
    return reqs

@app.get("/api/requests/{request_id}")
def get_request_detail(request_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM requests WHERE request_id = ?", (request_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404)
    return dict(row)

@app.get("/api/apps")
def get_apps():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM apps")
    apps = [dict(r) for r in cursor.fetchall()]
    
    for a in apps:
        cursor.execute("SELECT SUM(cost) as s, COUNT(*) as c FROM requests WHERE app_id = ?", (a['app_id'],))
        stats = cursor.fetchone()
        a['spend'] = stats['s'] or 0.0
        a['requests'] = stats['c'] or 0
        
        # Get RPM for the last 60 seconds
        cursor.execute("SELECT COUNT(*) as rpm FROM requests WHERE app_id = ? AND timestamp >= datetime('now', '-1 minute')", (a['app_id'],))
        rpm = cursor.fetchone()['rpm'] or 0
        a['current_rpm'] = rpm
        
        a['status'] = "Active" if a['spend'] < a['budget_limit'] else "Budget Exceeded"
        if rpm >= a['rpm_limit']:
             a['status'] = "Limited"
             
    conn.close()
    return apps

@app.patch("/api/apps/{app_id}/limits")
def patch_app_limits(app_id: str, payload: AppLimitUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE apps SET rpm_limit = ?, budget_limit = ? WHERE app_id = ?", 
                  (payload.rpm_limit, payload.budget_limit, app_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="App not found")
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.post("/api/demo/reset")
def reset():
    reset_demo()
    vector.clear_index()
    return {"status": "ok"}

@app.post("/api/demo/cache/clear")
def clear_cache():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM cache_entries')
    conn.commit()
    conn.close()
    vector.clear_index()
    return {"status": "ok"}

@app.get("/api/demo/report")
def export_report():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as t FROM requests")
    t = cursor.fetchone()['t']
    
    cursor.execute("SELECT COUNT(*) as h FROM requests WHERE cache_hit = 1")
    h = cursor.fetchone()['h']
    
    cursor.execute("SELECT SUM(cost) as c, SUM(routing_savings) as r FROM requests")
    cost_row = cursor.fetchone()
    total_spend = cost_row['c'] or 0.0
    routing_sav = cost_row['r'] or 0.0
    
    cursor.execute("SELECT SUM(tokens_prompt) as in_tkns, SUM(tokens_completion) as out_tkns FROM requests WHERE cache_hit = 1")
    row = cursor.fetchone()
    cache_in = row['in_tkns'] or 0
    cache_out = row['out_tkns'] or 0
    cache_avoided = router.calculate_cost(router.BASELINE_MODEL, cache_in, cache_out)
    
    cursor.execute("SELECT SUM(tokens_prompt) as in_tkns, SUM(tokens_completion) as out_tkns FROM requests")
    trow = cursor.fetchone()
    total_in = trow['in_tkns'] or 0
    total_out = trow['out_tkns'] or 0
    baseline_spend = router.calculate_cost(router.BASELINE_MODEL, total_in, total_out)
    
    cursor.execute("SELECT COUNT(*) as throttled FROM requests WHERE status_code = 429")
    throttled = cursor.fetchone()['throttled']
    
    cursor.execute("SELECT latency FROM requests WHERE status_code = 200 ORDER BY latency ASC")
    lats = [r['latency'] for r in cursor.fetchall()]
    avg_lat = sum(lats)/len(lats) if lats else 0
    p95_lat = lats[int(len(lats) * 0.95)] if lats else 0
    
    # Manual metrics
    cursor.execute("SELECT COUNT(*) as c FROM requests WHERE is_manual = 1")
    manual_total = cursor.fetchone()['c']
    cursor.execute("SELECT COUNT(*) as c FROM requests WHERE is_manual = 1 AND cache_hit = 1")
    manual_hits = cursor.fetchone()['c']
    
    cursor.execute("SELECT SUM(tokens_prompt) as i, SUM(tokens_completion) as o FROM requests WHERE is_manual = 1 AND cache_hit = 1")
    man_row = cursor.fetchone()
    manual_cache_sav = router.calculate_cost(router.BASELINE_MODEL, man_row['i'] or 0, man_row['o'] or 0)
    cursor.execute("SELECT SUM(routing_savings) as r FROM requests WHERE is_manual = 1")
    man_route_sav = cursor.fetchone()['r'] or 0.0
    
    conn.close()
    
    return {
        "total_requests": t,
        "cache_hit_rate": (h / t * 100) if t > 0 else 0,
        "actual_spend": total_spend,
        "estimated_baseline_spend": baseline_spend,
        "routing_savings": routing_sav,
        "estimated_cost_avoided": routing_sav + cache_avoided,
        "cost_avoided": routing_sav + cache_avoided,
        "manual_cost_avoided": manual_cache_sav + man_route_sav,
        "average_latency_ms": avg_lat,
        "p95_latency_ms": p95_lat,
        "throttled_count": throttled,
        "manual_prompt_count": manual_total,
        "manual_cache_hits": manual_hits
    }

@app.post("/api/demo/scenarios/{scenario_id}/run")
def run_scenario(scenario_id: str, background_tasks: BackgroundTasks):
    if scenario_id not in scenarios.SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")
    background_tasks.add_task(scenarios.run_scenario_background, scenario_id)
    return {"status": "started", "scenario": scenario_id}

@app.post("/api/demo/prompts/{request_id}/replay")
def replay_prompt(request_id: str, background_tasks: BackgroundTasks):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT prompt, app_id FROM requests WHERE request_id = ?", (request_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
        
    background_tasks.add_task(scenarios.replay_request_background, row['app_id'], row['prompt'])
    return {"status": "replaying"}
