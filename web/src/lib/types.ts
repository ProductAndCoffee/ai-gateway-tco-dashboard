export interface RequestModel {
    id: string;
    time: string;
    app: string;
    prompt: string;
    cache_hit: boolean;
    routed_model: string;
    status_code: number;
    similarity_score: number;
    latency: number;
    cost: number;
    status: string;
}

export interface OverviewMetrics {
    total_requests: number;
    actual_spend: number;
    cost_avoided: number;
    cache_hit_rate: number;
    latency_data?: { latency: number, cache_hit: boolean }[];
}

export interface AppModel {
    app_id: string;
    display_name: string;
    rpm_limit: number;
    budget_limit: number;
    spend: number;
    requests: number;
    current_rpm: number;
    status: string;
}

export interface RequestDetailModel {
    request_id: string;
    prompt: string;
    cache_hit: boolean;
    similarity_score: number;
    routed_model: string;
    routing_reason: string;
    tokens_prompt: number;
    tokens_completion: number;
    cost: number;
    routing_savings: number;
}
