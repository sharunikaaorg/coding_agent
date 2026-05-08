from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class TaskRequest(BaseModel):
    """Request model for coding tasks"""
    task: str
    context: str
    
class PipelineResult(BaseModel):
    """Result from a pipeline execution"""
    pipeline_type: str  # "baseline" or "optimized"
    task: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost: float
    latency: float
    output: str
    model_calls: int
    context_reduction: Optional[float] = None  # Only for optimized pipeline
    timestamp: datetime = datetime.now()

class EvaluationResult(BaseModel):
    """Comparison between baseline and optimized pipelines"""
    baseline_result: PipelineResult
    optimized_result: PipelineResult
    metrics: Dict[str, Any]
    
class ContextProcessingResult(BaseModel):
    """Result from context processing by small model"""
    original_context: str
    filtered_context: str
    summary: str
    relevant_sections: list[str]
    reduction_percent: float
    processing_time: float

class HealthStatus(BaseModel):
    """Health status of a service"""
    status: str  # "healthy", "degraded", "unhealthy"
    message: Optional[str] = None
    response_time: Optional[float] = None