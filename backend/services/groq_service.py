import httpx
import os
import tiktoken
import json
import time
from typing import Dict, Any
import logging
from models.schemas import HealthStatus

logger = logging.getLogger(__name__)

class GroqService:
    """Service for interacting with Groq API (Large Model)"""
    
    def __init__(self):
        self.api_keys = [
            os.getenv("GROQ_API_KEY"),
            os.getenv("GROQ_API_KEY_2"),
        ]
        self.api_keys = [k for k in self.api_keys if k]
        if not self.api_keys:
            raise ValueError("No GROQ_API_KEY environment variables set")
        
        self.current_key_index = 0
        self.base_url = "https://api.groq.com/openai/v1"
        self.models = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",      # fallback: smaller but higher limits
        ]
        self.model = self.models[0]
        
        # Token counting (approximate)
        try:
            self.tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
        except:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Pricing (tokens per dollar - approximate for Groq)
        self.input_cost_per_1k = 0.0005  # $0.0005 per 1K input tokens
        self.output_cost_per_1k = 0.0015  # $0.0015 per 1K output tokens
    
    async def health_check(self) -> HealthStatus:
        """Check if Groq service is healthy"""
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_keys[self.current_key_index]}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": "Hello"}],
                        "max_tokens": 10
                    },
                    timeout=30.0
                )
                
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    return HealthStatus(
                        status="healthy",
                        message="Groq API is responding",
                        response_time=response_time
                    )
                else:
                    return HealthStatus(
                        status="degraded",
                        message=f"Groq API returned status {response.status_code}",
                        response_time=response_time
                    )
                    
        except Exception as e:
            return HealthStatus(
                status="unhealthy",
                message=f"Groq API error: {str(e)}"
            )
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        try:
            return len(self.tokenizer.encode(text))
        except:
            # Fallback: approximate token count
            return len(text.split()) * 1.3
    
    def calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost based on token usage"""
        input_cost = (input_tokens / 1000) * self.input_cost_per_1k
        output_cost = (output_tokens / 1000) * self.output_cost_per_1k
        return input_cost + output_cost
    
    # Safe per-request input token budget (12K TPM limit minus output headroom)
    MAX_INPUT_TOKENS = 7500

    def _chunk_context(self, context: str) -> list[str]:
        """Split context into chunks that fit within the token limit."""
        tokens = self.tokenizer.encode(context)
        if len(tokens) <= self.MAX_INPUT_TOKENS:
            return [context]
        chunks = []
        for i in range(0, len(tokens), self.MAX_INPUT_TOKENS):
            chunks.append(self.tokenizer.decode(tokens[i:i + self.MAX_INPUT_TOKENS]))
        return chunks

    async def _call_groq(self, system_prompt: str, user_prompt: str, max_tokens: int = 4000) -> str:
        """Make a single Groq API call with automatic fallback on rate limits."""
        attempts = []
        for key in self.api_keys:
            for model in self.models:
                attempts.append((key, model))

        last_error = None
        for key, model in attempts:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": max_tokens,
                        "temperature": 0.1
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    if model != self.model:
                        logger.info(f"Used fallback model: {model}")
                    return response.json()["choices"][0]["message"]["content"]
                if response.status_code in (429, 413):
                    last_error = f"Groq API error: {response.status_code} - {response.text}"
                    logger.warning(f"Rate limited on {model} (key ...{key[-4:]}), trying next")
                    continue
                raise Exception(f"Groq API error: {response.status_code} - {response.text}")

        raise Exception(last_error or "All Groq API keys/models exhausted")

    async def process_task(self, task: str, context: str) -> Dict[str, Any]:
        """
        Process a coding task with given context using Groq.
        Automatically chunks large contexts to stay within TPM limits.
        """
        try:
            system_prompt = """You are an expert coding assistant. Analyze the given context and complete the requested task.
            
Focus on:
1. Accuracy and correctness
2. Following best practices  
3. Clear explanations
4. Practical solutions

Be concise but thorough in your response."""

            chunks = self._chunk_context(context)
            total_input_tokens = 0
            total_output_tokens = 0

            if len(chunks) == 1:
                # Single chunk — direct call
                user_prompt = f"Task: {task}\n\nContext:\n{context}\n\nPlease complete this task based on the provided context."
                total_input_tokens = self.count_tokens(system_prompt + user_prompt)
                output = await self._call_groq(system_prompt, user_prompt)
                total_output_tokens = self.count_tokens(output)
            else:
                # Multiple chunks — process each, then merge
                logger.info(f"Context too large, splitting into {len(chunks)} chunks")
                chunk_outputs = []
                for idx, chunk in enumerate(chunks):
                    user_prompt = f"Task: {task}\n\nContext (part {idx+1}/{len(chunks)}):\n{chunk}\n\nAnalyze this part of the context for the task above. Provide your findings."
                    total_input_tokens += self.count_tokens(system_prompt + user_prompt)
                    chunk_output = await self._call_groq(system_prompt, user_prompt)
                    total_output_tokens += self.count_tokens(chunk_output)
                    chunk_outputs.append(chunk_output)
                    # Wait between chunks to respect TPM rate limit
                    if idx < len(chunks) - 1:
                        import asyncio
                        await asyncio.sleep(62)

                # Merge step — summarize all chunk results
                merge_prompt = f"Task: {task}\n\nBelow are analyses of different parts of the codebase. Synthesize them into one coherent, complete response.\n\n" + "\n\n---\n\n".join(
                    f"Part {i+1}:\n{o}" for i, o in enumerate(chunk_outputs)
                )
                total_input_tokens += self.count_tokens(system_prompt + merge_prompt)
                output = await self._call_groq(system_prompt, merge_prompt)
                total_output_tokens += self.count_tokens(output)

            total_tokens = total_input_tokens + total_output_tokens
            cost = self.calculate_cost(total_input_tokens, total_output_tokens)

            logger.info(f"Groq processing complete - Input: {total_input_tokens}, Output: {total_output_tokens}, Cost: ${cost:.4f}, Chunks: {len(chunks)}")

            return {
                "output": output,
                "input_tokens": total_input_tokens,
                "output_tokens": total_output_tokens,
                "total_tokens": total_tokens,
                "cost": cost
            }

        except Exception as e:
            logger.error(f"Groq service error: {str(e)}")
            raise Exception(f"Failed to process with Groq: {str(e)}")