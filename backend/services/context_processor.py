import time
import re
from typing import Dict, Any, List
import logging
from services.ollama_service import OllamaService
from models.schemas import ContextProcessingResult

logger = logging.getLogger(__name__)

class ContextProcessor:
    """Advanced context processing using small model to filter and optimize input"""
    
    def __init__(self, ollama_service: OllamaService):
        self.ollama_service = ollama_service
        
        # Context size limits (approximate)
        self.max_context_length = 50000  # Characters
        self.target_context_length = 20000  # Target after filtering
        
    def _analyze_context_type(self, context: str) -> Dict[str, Any]:
        """Analyze what type of context we're dealing with"""
        analysis = {
            "type": "unknown",
            "has_code": False,
            "has_logs": False,
            "has_errors": False,
            "language": None,
            "line_count": len(context.split("\n")),
            "char_count": len(context)
        }
        
        # Detect code patterns
        code_patterns = [
            (r'def\s+\w+\(', 'python'),
            (r'function\s+\w+\(', 'javascript'),
            (r'class\s+\w+', 'oop'),
            (r'import\s+\w+', 'python'),
            (r'#include\s*<', 'c/cpp'),
            (r'public\s+class\s+\w+', 'java')
        ]
        
        for pattern, lang in code_patterns:
            if re.search(pattern, context):
                analysis["has_code"] = True
                analysis["language"] = lang
                break
        
        # Detect logs
        log_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # Date
            r'ERROR|WARN|INFO|DEBUG',  # Log levels
            r'Exception|Error|Traceback'  # Error indicators
        ]
        
        for pattern in log_patterns:
            if re.search(pattern, context, re.IGNORECASE):
                analysis["has_logs"] = True
                break
        
        # Detect errors
        error_patterns = [
            r'Exception', r'Error', r'Failed', r'stack trace',
            r'traceback', r'assertion.*failed', r'null pointer'
        ]
        
        for pattern in error_patterns:
            if re.search(pattern, context, re.IGNORECASE):
                analysis["has_errors"] = True
                break
        
        # Determine primary type
        if analysis["has_code"] and analysis["has_errors"]:
            analysis["type"] = "code_with_errors"
        elif analysis["has_code"]:
            analysis["type"] = "code"
        elif analysis["has_logs"]:
            analysis["type"] = "logs"
        elif analysis["has_errors"]:
            analysis["type"] = "error_report"
        else:
            analysis["type"] = "text"
            
        return analysis
    
    def _chunk_large_context(self, context: str, chunk_size: int = 15000) -> List[str]:
        """Split large context into manageable chunks"""
        if len(context) <= chunk_size:
            return [context]
        
        chunks = []
        lines = context.split("\n")
        current_chunk = ""
        
        for line in lines:
            if len(current_chunk + line + "\n") <= chunk_size:
                current_chunk += line + "\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = line + "\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def _process_chunk(self, task: str, chunk: str, context_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single chunk of context"""
        try:
            # Create a specialized prompt based on context type
            if context_analysis["type"] == "code_with_errors":
                filter_prompt = f"""You are analyzing code with errors for the task: "{task}"

Focus on:
1. Error messages and stack traces
2. The specific function/method where the error occurs  
3. Related functions that might be involved
4. Variable definitions and their usage
5. Remove unrelated imports, comments, and helper functions

Code to analyze:
{chunk}

Extract only the most relevant parts for debugging this specific issue."""

            elif context_analysis["type"] == "code":
                filter_prompt = f"""You are analyzing code for the task: "{task}"

Focus on:
1. Functions/methods directly related to the task
2. Class definitions if relevant
3. Variable declarations and key logic
4. Remove boilerplate, unrelated imports, and utility functions
5. Keep structure that helps understand the code flow

Code to analyze:
{chunk}

Extract only the parts needed to complete this task."""

            elif context_analysis["type"] == "logs":
                filter_prompt = f"""You are analyzing logs for the task: "{task}"

Focus on:
1. Error messages and warnings
2. Timestamps around when issues occurred
3. Request/response patterns if relevant
4. Remove verbose debug info and routine operations
5. Keep context that explains the problem

Logs to analyze:
{chunk}

Extract only the log entries relevant to this task."""

            else:
                filter_prompt = f"""You are filtering content for the task: "{task}"

Extract only the most relevant information needed to complete this specific task.
Remove redundant, verbose, or unrelated content.

Content to analyze:
{chunk}

Focus on what's directly needed for: {task}"""

            # Use Ollama to filter this chunk
            result = await self.ollama_service.generate_completion(
                filter_prompt, 
                max_tokens=2000
            )
            
            return {
                "filtered_content": result["response"].strip(),
                "processing_time": result["processing_time"]
            }
            
        except Exception as e:
            logger.error(f"Error processing chunk: {str(e)}")
            return {
                "filtered_content": chunk,  # Fallback to original
                "processing_time": 0.0
            }
    
    async def process_context(self, task: str, context: str) -> Dict[str, Any]:
        """
        Main method to process and filter context using the small model
        
        Args:
            task: The specific task to be performed
            context: The full context (code, logs, etc.)
            
        Returns:
            Dict containing filtered context and processing metadata
        """
        start_time = time.time()
        
        try:
            # Analyze context type
            context_analysis = self._analyze_context_type(context)
            logger.info(f"Context analysis: {context_analysis}")
            
            # If context is small enough, use simple filtering
            if len(context) <= self.max_context_length:
                result = await self.ollama_service.filter_context(task, context)
                
                processing_time = time.time() - start_time
                
                return {
                    "original_context": context,
                    "filtered_context": result["filtered_context"],
                    "summary": result["summary"],
                    "relevant_sections": [result["filtered_context"]],
                    "reduction_percent": result["reduction_percent"],
                    "processing_time": processing_time,
                    "context_analysis": context_analysis
                }
            
            # For large context, chunk and process
            chunks = self._chunk_large_context(context)
            logger.info(f"Processing {len(chunks)} chunks for large context")
            
            filtered_chunks = []
            total_processing_time = 0
            
            for i, chunk in enumerate(chunks):
                logger.info(f"Processing chunk {i+1}/{len(chunks)}")
                
                chunk_result = await self._process_chunk(task, chunk, context_analysis)
                filtered_chunks.append(chunk_result["filtered_content"])
                total_processing_time += chunk_result["processing_time"]
            
            # Combine filtered chunks
            combined_filtered = "\n\n".join([chunk for chunk in filtered_chunks if chunk.strip()])
            
            # Calculate reduction
            original_length = len(context)
            filtered_length = len(combined_filtered)
            reduction_percent = (1 - filtered_length / original_length) * 100 if original_length > 0 else 0
            
            # Generate summary
            summary = f"Processed {len(chunks)} chunks. Reduced from {original_length} to {filtered_length} characters ({reduction_percent:.1f}% reduction). Context type: {context_analysis['type']}"
            
            processing_time = time.time() - start_time
            
            return {
                "original_context": context,
                "filtered_context": combined_filtered,
                "summary": summary,
                "relevant_sections": filtered_chunks,
                "reduction_percent": reduction_percent,
                "processing_time": processing_time,
                "context_analysis": context_analysis,
                "chunks_processed": len(chunks)
            }
            
        except Exception as e:
            logger.error(f"Context processing failed: {str(e)}")
            
            # Fallback: return original context with minimal processing
            processing_time = time.time() - start_time
            
            return {
                "original_context": context,
                "filtered_context": context,  # No filtering applied
                "summary": f"Processing failed: {str(e)}. Returned original context.",
                "relevant_sections": [context],
                "reduction_percent": 0.0,
                "processing_time": processing_time,
                "context_analysis": self._analyze_context_type(context),
                "error": str(e)
            }