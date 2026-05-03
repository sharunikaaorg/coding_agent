import httpx
import os
import json
import time
from typing import Dict, Any
import logging
from models.schemas import HealthStatus

logger = logging.getLogger(__name__)

class OllamaService:
    """Service for interacting with Ollama (Small Model for Context Processing)"""
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = "mistral"  # Using local Mistral model
        
        # Ensure the model is available
        self.model_ready = False
    
    async def health_check(self) -> HealthStatus:
        """Check if Ollama service is healthy and model is loaded"""
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient() as client:
                # Check if Ollama is running
                response = await client.get(f"{self.base_url}/api/tags", timeout=10.0)
                
                if response.status_code != 200:
                    return HealthStatus(
                        status="unhealthy",
                        message=f"Ollama server returned status {response.status_code}"
                    )
                
                # Check if our model is available
                models = response.json()
                available_models = [model["name"] for model in models.get("models", [])]
                
                response_time = time.time() - start_time
                
                if self.model in available_models:
                    self.model_ready = True
                    return HealthStatus(
                        status="healthy",
                        message=f"Ollama running with model {self.model}",
                        response_time=response_time
                    )
                else:
                    return HealthStatus(
                        status="degraded",
                        message=f"Model {self.model} not found. Available: {available_models}",
                        response_time=response_time
                    )
                    
        except httpx.ConnectError:
            return HealthStatus(
                status="unhealthy",
                message="Cannot connect to Ollama server. Is it running?"
            )
        except Exception as e:
            return HealthStatus(
                status="unhealthy",
                message=f"Ollama error: {str(e)}"
            )
    
    async def ensure_model_loaded(self):
        """Ensure the model is loaded in Ollama"""
        try:
            if not self.model_ready:
                health = await self.health_check()
                if health.status != "healthy":
                    # Try to pull the model
                    await self.pull_model()
        except Exception as e:
            logger.warning(f"Could not ensure model loaded: {e}")
    
    async def pull_model(self):
        """Pull the model if it's not available"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": self.model},
                    timeout=300.0  # Model pulling can take a while
                )
                
                if response.status_code == 200:
                    logger.info(f"Successfully pulled model {self.model}")
                    self.model_ready = True
                else:
                    logger.error(f"Failed to pull model {self.model}: {response.text}")
                    
        except Exception as e:
            logger.error(f"Error pulling model: {e}")
    
    async def generate_completion(self, prompt: str, max_tokens: int = 2000) -> Dict[str, Any]:
        """
        Generate a completion using Ollama
        
        Args:
            prompt: The input prompt
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict containing the response and metadata
        """
        try:
            await self.ensure_model_loaded()
            
            start_time = time.time()
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "num_predict": max_tokens,
                            "temperature": 0.1,
                            "top_p": 0.9
                        }
                    },
                    timeout=120.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Ollama API error: {response.status_code} - {response.text}")
                
                result = response.json()
                processing_time = time.time() - start_time
                
                return {
                    "response": result.get("response", ""),
                    "processing_time": processing_time,
                    "context": result.get("context", []),
                    "done": result.get("done", True)
                }
                
        except Exception as e:
            logger.error(f"Ollama generation error: {str(e)}")
            raise Exception(f"Failed to generate with Ollama: {str(e)}")
    
    async def filter_context(self, task: str, context: str) -> Dict[str, Any]:
        """
        Use Ollama to filter and extract relevant context for a task
        
        Args:
            task: The specific task
            context: The full context to filter
            
        Returns:
            Dict containing filtered context and metadata
        """
        prompt = f"""You are a context filtering assistant. Your job is to extract only the most relevant parts of the given context for the specific task.

Task: {task}

Full Context:
{context}

Instructions:
1. Identify the most relevant code sections, functions, classes, or logs for this task
2. Remove boilerplate, imports, and unrelated code unless directly relevant
3. Keep error messages, stack traces, and debug info if they relate to the task
4. Maintain code structure and relationships that are important for understanding
5. Summarize what you removed and why

Please respond with:
RELEVANT_CONTEXT:
[Only the filtered, relevant parts here]

SUMMARY:
[Brief summary of what was kept and what was removed]

REDUCTION:
[Estimate percentage of content removed, e.g., "60%" if you kept 40%]"""

        try:
            result = await self.generate_completion(prompt, max_tokens=3000)
            
            response_text = result["response"]
            
            # Parse the structured response
            relevant_context = ""
            summary = ""
            reduction_estimate = "0%"
            
            lines = response_text.split("\n")
            current_section = None
            
            for line in lines:
                if line.startswith("RELEVANT_CONTEXT:"):
                    current_section = "context"
                    continue
                elif line.startswith("SUMMARY:"):
                    current_section = "summary"
                    continue
                elif line.startswith("REDUCTION:"):
                    current_section = "reduction"
                    continue
                
                if current_section == "context":
                    relevant_context += line + "\n"
                elif current_section == "summary":
                    summary += line + " "
                elif current_section == "reduction":
                    reduction_text = line.strip()
                    # Extract percentage
                    import re
                    match = re.search(r'(\d+)%', reduction_text)
                    if match:
                        reduction_estimate = match.group(0)
            
            # Calculate actual reduction
            original_length = len(context)
            filtered_length = len(relevant_context.strip())
            
            # If parsing produced empty result, use the full Ollama response as filtered context
            if filtered_length == 0:
                relevant_context = response_text
                filtered_length = len(relevant_context.strip())
                summary = "Model response did not follow expected format; using full response."
            
            actual_reduction = max(0, (1 - filtered_length / original_length) * 100) if original_length > 0 else 0
            
            return {
                "filtered_context": relevant_context.strip(),
                "summary": summary.strip(),
                "reduction_percent": actual_reduction,
                "processing_time": result["processing_time"],
                "estimated_reduction": reduction_estimate
            }
            
        except Exception as e:
            logger.error(f"Context filtering error: {str(e)}")
            # Fallback: return original context with minimal processing
            return {
                "filtered_context": context,
                "summary": f"Error during filtering: {str(e)}",
                "reduction_percent": 0.0,
                "processing_time": 0.0,
                "estimated_reduction": "0%"
            }