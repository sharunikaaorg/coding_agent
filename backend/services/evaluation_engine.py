import time
from typing import Dict, Any, List
import logging
import httpx
import os
from models.schemas import PipelineResult, EvaluationResult

logger = logging.getLogger(__name__)

class EvaluationEngine:
    """Engine for evaluating and comparing pipeline performance"""
    
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_base_url = "https://api.groq.com/openai/v1"
        
    async def _evaluate_output_quality(self, task: str, baseline_output: str, optimized_output: str, original_context: str) -> Dict[str, Any]:
        """
        Use LLM-as-judge to evaluate output quality
        
        Args:
            task: The original task
            baseline_output: Output from baseline pipeline
            optimized_output: Output from optimized pipeline  
            original_context: Original context for reference
            
        Returns:
            Quality evaluation scores and analysis
        """
        try:
            evaluation_prompt = f"""You are evaluating the quality of two AI coding assistant responses to the same task.

TASK: {task}

ORIGINAL CONTEXT (for reference):
{original_context[:2000]}...

BASELINE RESPONSE:
{baseline_output}

OPTIMIZED RESPONSE:  
{optimized_output}

Please evaluate both responses on these criteria (score 1-10):

1. CORRECTNESS: How accurate and correct is the response?
2. COMPLETENESS: Does it fully address the task requirements?
3. CLARITY: How clear and well-explained is the response?
4. PRACTICALITY: How useful and actionable is the response?

Provide scores in this format:
BASELINE_SCORES:
Correctness: X/10
Completeness: X/10  
Clarity: X/10
Practicality: X/10
Overall: X/10

OPTIMIZED_SCORES:
Correctness: X/10
Completeness: X/10
Clarity: X/10
Practicality: X/10
Overall: X/10

ANALYSIS:
[Brief analysis of key differences and which performs better overall]"""

            if not self.groq_api_key:
                return {
                    "baseline_score": 7.0,
                    "optimized_score": 7.0,
                    "analysis": "Quality evaluation unavailable (no Groq API key)",
                    "criteria_scores": {}
                }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.groq_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama3-70b-8192",
                        "messages": [{"role": "user", "content": evaluation_prompt}],
                        "max_tokens": 1000,
                        "temperature": 0.1
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Evaluation API error: {response.status_code}")
                
                evaluation_text = response.json()["choices"][0]["message"]["content"]
                
                # Parse scores
                scores = self._parse_evaluation_scores(evaluation_text)
                
                return scores
                
        except Exception as e:
            logger.error(f"Quality evaluation failed: {str(e)}")
            return {
                "baseline_score": 7.0,
                "optimized_score": 7.0,
                "analysis": f"Evaluation failed: {str(e)}",
                "criteria_scores": {}
            }
    
    def _parse_evaluation_scores(self, evaluation_text: str) -> Dict[str, Any]:
        """Parse evaluation scores from LLM response"""
        try:
            import re
            
            # Extract baseline scores
            baseline_pattern = r'BASELINE_SCORES:.*?Overall:\s*(\d+(?:\.\d+)?)'
            baseline_match = re.search(baseline_pattern, evaluation_text, re.DOTALL)
            baseline_score = float(baseline_match.group(1)) if baseline_match else 7.0
            
            # Extract optimized scores  
            optimized_pattern = r'OPTIMIZED_SCORES:.*?Overall:\s*(\d+(?:\.\d+)?)'
            optimized_match = re.search(optimized_pattern, evaluation_text, re.DOTALL)
            optimized_score = float(optimized_match.group(1)) if optimized_match else 7.0
            
            # Extract analysis
            analysis_pattern = r'ANALYSIS:\s*(.*?)(?:\n\n|\Z)'
            analysis_match = re.search(analysis_pattern, evaluation_text, re.DOTALL)
            analysis = analysis_match.group(1).strip() if analysis_match else "No analysis available"
            
            # Extract detailed criteria scores
            criteria_scores = {}
            criteria = ['Correctness', 'Completeness', 'Clarity', 'Practicality']
            
            for criteria_name in criteria:
                # Baseline criteria scores
                baseline_criteria_pattern = f'BASELINE_SCORES:.*?{criteria_name}:\s*(\d+(?:\.\d+)?)'
                baseline_criteria_match = re.search(baseline_criteria_pattern, evaluation_text, re.DOTALL)
                baseline_criteria_score = float(baseline_criteria_match.group(1)) if baseline_criteria_match else 7.0
                
                # Optimized criteria scores
                optimized_criteria_pattern = f'OPTIMIZED_SCORES:.*?{criteria_name}:\s*(\d+(?:\.\d+)?)'
                optimized_criteria_match = re.search(optimized_criteria_pattern, evaluation_text, re.DOTALL)
                optimized_criteria_score = float(optimized_criteria_match.group(1)) if optimized_criteria_match else 7.0
                
                criteria_scores[criteria_name.lower()] = {
                    "baseline": baseline_criteria_score,
                    "optimized": optimized_criteria_score
                }
            
            return {
                "baseline_score": baseline_score,
                "optimized_score": optimized_score,
                "analysis": analysis,
                "criteria_scores": criteria_scores,
                "raw_evaluation": evaluation_text
            }
            
        except Exception as e:
            logger.error(f"Error parsing evaluation scores: {str(e)}")
            return {
                "baseline_score": 7.0,
                "optimized_score": 7.0,
                "analysis": f"Score parsing failed: {str(e)}",
                "criteria_scores": {}
            }
    
    def _calculate_performance_metrics(self, baseline: PipelineResult, optimized: PipelineResult) -> Dict[str, Any]:
        """Calculate performance comparison metrics"""
        
        # Token metrics
        token_reduction = baseline.total_tokens - optimized.total_tokens
        token_reduction_percent = (token_reduction / baseline.total_tokens * 100) if baseline.total_tokens > 0 else 0
        
        # Cost metrics
        cost_reduction = baseline.cost - optimized.cost
        cost_reduction_percent = (cost_reduction / baseline.cost * 100) if baseline.cost > 0 else 0
        
        # Latency metrics
        latency_improvement = baseline.latency - optimized.latency
        latency_improvement_percent = (latency_improvement / baseline.latency * 100) if baseline.latency > 0 else 0
        
        # Efficiency metrics
        tokens_per_second_baseline = baseline.total_tokens / baseline.latency if baseline.latency > 0 else 0
        tokens_per_second_optimized = optimized.total_tokens / optimized.latency if optimized.latency > 0 else 0
        
        cost_per_token_baseline = baseline.cost / baseline.total_tokens if baseline.total_tokens > 0 else 0
        cost_per_token_optimized = optimized.cost / optimized.total_tokens if optimized.total_tokens > 0 else 0
        
        return {
            "token_metrics": {
                "baseline_tokens": baseline.total_tokens,
                "optimized_tokens": optimized.total_tokens,
                "tokens_saved": token_reduction,
                "token_reduction_percent": token_reduction_percent
            },
            "cost_metrics": {
                "baseline_cost": baseline.cost,
                "optimized_cost": optimized.cost,
                "cost_saved": cost_reduction,
                "cost_reduction_percent": cost_reduction_percent,
                "cost_per_token_baseline": cost_per_token_baseline,
                "cost_per_token_optimized": cost_per_token_optimized
            },
            "performance_metrics": {
                "baseline_latency": baseline.latency,
                "optimized_latency": optimized.latency,
                "latency_improvement": latency_improvement,
                "latency_improvement_percent": latency_improvement_percent,
                "tokens_per_second_baseline": tokens_per_second_baseline,
                "tokens_per_second_optimized": tokens_per_second_optimized
            },
            "model_calls": {
                "baseline_calls": baseline.model_calls,
                "optimized_calls": optimized.model_calls
            },
            "context_reduction": optimized.context_reduction or 0.0
        }
    
    async def compare_results(self, baseline: PipelineResult, optimized: PipelineResult) -> EvaluationResult:
        """
        Compare baseline and optimized pipeline results
        
        Args:
            baseline: Result from baseline pipeline
            optimized: Result from optimized pipeline
            
        Returns:
            Comprehensive evaluation comparing both pipelines
        """
        try:
            logger.info("Starting pipeline comparison evaluation")
            
            # Calculate performance metrics
            performance_metrics = self._calculate_performance_metrics(baseline, optimized)
            
            # Evaluate output quality using LLM-as-judge
            # Note: We don't have the original context here, so we'll use the task description
            quality_evaluation = await self._evaluate_output_quality(
                task=baseline.task,
                baseline_output=baseline.output,
                optimized_output=optimized.output,
                original_context="[Context not available for quality evaluation]"
            )
            
            # Overall assessment
            overall_metrics = {
                "performance": performance_metrics,
                "quality": quality_evaluation,
                "summary": {
                    "token_reduction_percent": performance_metrics["token_metrics"]["token_reduction_percent"],
                    "cost_reduction_percent": performance_metrics["cost_metrics"]["cost_reduction_percent"],
                    "latency_improvement_percent": performance_metrics["performance_metrics"]["latency_improvement_percent"],
                    "quality_difference": quality_evaluation["optimized_score"] - quality_evaluation["baseline_score"],
                    "context_reduction_percent": optimized.context_reduction or 0.0
                },
                "recommendation": self._generate_recommendation(performance_metrics, quality_evaluation)
            }
            
            return EvaluationResult(
                baseline_result=baseline,
                optimized_result=optimized,
                metrics=overall_metrics
            )
            
        except Exception as e:
            logger.error(f"Evaluation comparison failed: {str(e)}")
            
            # Return basic comparison without quality evaluation
            basic_metrics = self._calculate_performance_metrics(baseline, optimized)
            
            return EvaluationResult(
                baseline_result=baseline,
                optimized_result=optimized,
                metrics={
                    "performance": basic_metrics,
                    "quality": {
                        "baseline_score": 7.0,
                        "optimized_score": 7.0,
                        "analysis": f"Quality evaluation failed: {str(e)}"
                    },
                    "error": str(e)
                }
            )
    
    def _generate_recommendation(self, performance_metrics: Dict, quality_evaluation: Dict) -> str:
        """Generate a recommendation based on the evaluation results"""
        
        token_reduction = performance_metrics["token_metrics"]["token_reduction_percent"]
        cost_reduction = performance_metrics["cost_metrics"]["cost_reduction_percent"]
        latency_improvement = performance_metrics["performance_metrics"]["latency_improvement_percent"]
        quality_diff = quality_evaluation["optimized_score"] - quality_evaluation["baseline_score"]
        
        if token_reduction > 30 and cost_reduction > 25 and quality_diff >= -0.5:
            return "✅ RECOMMENDED: Optimized pipeline shows significant efficiency gains with maintained quality"
        elif token_reduction > 15 and cost_reduction > 10 and quality_diff >= 0:
            return "👍 BENEFICIAL: Optimized pipeline provides moderate improvements"
        elif quality_diff < -1:
            return "⚠️ CAUTION: Optimized pipeline reduces quality significantly"
        elif token_reduction < 5:
            return "❓ MARGINAL: Limited efficiency gains from optimization"
        else:
            return "📊 MIXED: Trade-offs between efficiency and other factors need consideration"