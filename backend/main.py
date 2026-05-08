from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Dict, Any, Optional
import time
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Context-Optimized Coding Agent", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import our services
from services.groq_service import GroqService
from services.ollama_service import OllamaService
from services.context_processor import ContextProcessor
from services.evaluation_engine import EvaluationEngine
from models.schemas import TaskRequest, PipelineResult, EvaluationResult

# Initialize services
groq_service = GroqService()
ollama_service = OllamaService()
context_processor = ContextProcessor(ollama_service)
evaluation_engine = EvaluationEngine()

@app.get("/")
async def root():
    return {"message": "Context-Optimized Coding Agent API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if Groq service is available
        groq_status = await groq_service.health_check()
        
        # Check if Ollama service is available
        ollama_status = await ollama_service.health_check()
        
        return {
            "status": "healthy",
            "services": {
                "groq": groq_status,
                "ollama": ollama_status
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.post("/baseline", response_model=PipelineResult)
async def run_baseline_pipeline(task_request: TaskRequest):
    """
    Run baseline pipeline: Send full context directly to Groq
    """
    try:
        start_time = time.time()
        
        # Send full context directly to Groq
        result = await groq_service.process_task(
            task=task_request.task,
            context=task_request.context
        )
        
        end_time = time.time()
        
        return PipelineResult(
            pipeline_type="baseline",
            task=task_request.task,
            input_tokens=result["input_tokens"],
            output_tokens=result["output_tokens"],
            total_tokens=result["total_tokens"],
            cost=result["cost"],
            latency=end_time - start_time,
            output=result["output"],
            model_calls=1
        )
        
    except Exception as e:
        logger.error(f"Baseline pipeline failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimized", response_model=PipelineResult)
async def run_optimized_pipeline(task_request: TaskRequest):
    """
    Run optimized pipeline: Small model filters context → Groq reasons
    """
    try:
        start_time = time.time()
        
        # Step 1: Process context with small model (Ollama)
        processed_context = await context_processor.process_context(
            task=task_request.task,
            context=task_request.context
        )
        
        # Step 2: Send filtered context to Groq
        result = await groq_service.process_task(
            task=task_request.task,
            context=processed_context["filtered_context"]
        )
        
        end_time = time.time()
        
        return PipelineResult(
            pipeline_type="optimized",
            task=task_request.task,
            input_tokens=result["input_tokens"],
            output_tokens=result["output_tokens"],
            total_tokens=result["total_tokens"],
            cost=result["cost"],
            latency=end_time - start_time,
            output=result["output"],
            model_calls=2,  # Ollama + Groq
            context_reduction=processed_context["reduction_percent"]
        )
        
    except Exception as e:
        logger.error(f"Optimized pipeline failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate", response_model=EvaluationResult)
async def evaluate_pipelines(task_request: TaskRequest):
    """
    Run both pipelines and compare their performance
    """
    try:
        # Run both pipelines
        baseline_result = await run_baseline_pipeline(task_request)
        optimized_result = await run_optimized_pipeline(task_request)
        
        # Evaluate results
        evaluation = await evaluation_engine.compare_results(
            baseline=baseline_result,
            optimized=optimized_result
        )
        
        return evaluation
        
    except Exception as e:
        logger.error(f"Evaluation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)