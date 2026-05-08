export interface TaskRequest {
  task: string;
  context: string;
}

export interface PipelineResult {
  pipeline_type: 'baseline' | 'optimized';
  task: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  latency: number;
  output: string;
  model_calls: number;
  context_reduction?: number;
  timestamp: string;
}

export interface QualityEvaluation {
  baseline_score: number;
  optimized_score: number;
  analysis: string;
  criteria_scores: {
    [key: string]: {
      baseline: number;
      optimized: number;
    };
  };
}

export interface PerformanceMetrics {
  token_metrics: {
    baseline_tokens: number;
    optimized_tokens: number;
    tokens_saved: number;
    token_reduction_percent: number;
  };
  cost_metrics: {
    baseline_cost: number;
    optimized_cost: number;
    cost_saved: number;
    cost_reduction_percent: number;
    cost_per_token_baseline: number;
    cost_per_token_optimized: number;
  };
  performance_metrics: {
    baseline_latency: number;
    optimized_latency: number;
    latency_improvement: number;
    latency_improvement_percent: number;
    tokens_per_second_baseline: number;
    tokens_per_second_optimized: number;
  };
  model_calls: {
    baseline_calls: number;
    optimized_calls: number;
  };
  context_reduction: number;
}

export interface EvaluationResult {
  baseline_result: PipelineResult;
  optimized_result: PipelineResult;
  metrics: {
    performance: PerformanceMetrics;
    quality: QualityEvaluation;
    summary: {
      token_reduction_percent: number;
      cost_reduction_percent: number;
      latency_improvement_percent: number;
      quality_difference: number;
      context_reduction_percent: number;
    };
    recommendation: string;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  response_time?: number;
}

export interface HealthCheck {
  status: string;
  services: {
    groq: HealthStatus;
    ollama: HealthStatus;
  };
}