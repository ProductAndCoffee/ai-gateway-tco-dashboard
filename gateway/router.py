from typing import Tuple

BASELINE_MODEL = "gpt-4-class"
ADVANCED_MODEL = "gpt-4-class"
CHEAP_MODEL = "gemini-flash-class"

# Pricing dictionaries (Input per 1k, Output per 1k)
PRICING = {
    "gpt-4-class": {"in": 0.010, "out": 0.030},
    "gemini-flash-class": {"in": 0.00035, "out": 0.00105}
}

def estimate_tokens(text: str) -> int:
    """A naive token estimator: words * 1.3."""
    if not text: return 0
    return int(len(text.split()) * 1.3)

def classify_task_type(prompt: str, app_id: str) -> str:
    """
    Very naive keyword-based task classifier for demo purposes.
    In a real system, this might be an LLM call or a fast classifier model.
    """
    p = prompt.lower()
    
    if app_id == "live-data-query":
        return "live-data"
        
    if "categorize" in p or "classify" in p:
        return "classification"
    if "rewrite" in p or "rephrase" in p:
        return "rewrite"
    if "how do i" in p or "what is" in p or "faq" in p or "process to" in p:
        return "faq"
    if "analyze" in p or "financial report" in p:
        return "analysis"
    if "summarize" in p or "tldr" in p:
        return "summarization"
    if "think step by step" in p or "reasoning" in p:
        return "reasoning"
        
    return "general"

def determine_route(prompt: str, task_type: str, estimated_tokens: int) -> Tuple[str, str]:
    """
    Applies the routing policy based on task type and token length.
    Returns (routed_model, routing_reason).
    """
    if task_type == "live-data":
        return ADVANCED_MODEL, "Task type 'live-data' requires highest accuracy model."
        
    if estimated_tokens < 250 and task_type in ["classification", "rewrite", "faq"]:
        return CHEAP_MODEL, f"Task type '{task_type}' and token estimate < 250. Eligible for cheap_fast_model."
        
    if estimated_tokens >= 250 or task_type in ["analysis", "summarization", "reasoning"]:
        return ADVANCED_MODEL, f"Task type '{task_type}' or token estimate >= 250. Routing to advanced_model."
        
    return BASELINE_MODEL, "No specific routing rules matched. Routing to baseline_default_model."

def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculates the cost based on pricing."""
    rates = PRICING.get(model, PRICING[BASELINE_MODEL])
    in_cost = (input_tokens / 1000.0) * rates["in"]
    out_cost = (output_tokens / 1000.0) * rates["out"]
    return in_cost + out_cost

def calculate_savings(actual_model: str, input_tokens: int, output_tokens: int, cache_hit: bool) -> Tuple[float, float, float]:
    """
    Calculates cost metrics for the dashboard.
    Returns (actual_cost, cache_cost_avoided, routing_savings)
    """
    baseline_cost = calculate_cost(BASELINE_MODEL, input_tokens, output_tokens)
    
    if cache_hit:
        return (0.0, baseline_cost, 0.0)
        
    actual_cost = calculate_cost(actual_model, input_tokens, output_tokens)
    routing_savings = max(0.0, baseline_cost - actual_cost)
    
    return (actual_cost, 0.0, routing_savings)
