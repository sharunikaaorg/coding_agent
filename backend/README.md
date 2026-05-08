# Context-Optimized Coding Agent Backend

A FastAPI-based backend that demonstrates context optimization using a multi-model approach for coding assistance.

## System Architecture

### Two-Pipeline Approach

1. **Baseline Pipeline**: Full context → Groq (LLaMA3-70B)
2. **Optimized Pipeline**: Context → Ollama (LLaMA3-8B) → Filtered Context → Groq (LLaMA3-70B)

### Key Components

- **Groq Service**: Large model for reasoning and final output
- **Ollama Service**: Small model for context filtering and preprocessing  
- **Context Processor**: Intelligent context analysis and filtering
- **Evaluation Engine**: Performance comparison and quality assessment

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:

```
GROQ_API_KEY=your_groq_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. Install and Start Ollama

Install Ollama from https://ollama.ai

Start Ollama and pull the model:

```bash
ollama serve
ollama pull llama3
```

### 4. Start the Backend Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
```
GET /health
```

### Baseline Pipeline
```
POST /baseline
{
  "task": "Find the bug in this code",
  "context": "def calculate(x, y):\n    return x / y"
}
```

### Optimized Pipeline  
```
POST /optimized
{
  "task": "Find the bug in this code", 
  "context": "def calculate(x, y):\n    return x / y"
}
```

### Compare Both Pipelines
```
POST /evaluate
{
  "task": "Find the bug in this code",
  "context": "def calculate(x, y):\n    return x / y" 
}
```

## Expected Metrics

The system tracks and compares:

- **Token Reduction**: 40-70% typical reduction
- **Cost Savings**: Proportional to token reduction
- **Latency**: May vary based on processing overhead
- **Quality**: LLM-as-judge evaluation
- **Context Compression**: How much context was filtered

## Architecture Benefits

1. **Cost Efficiency**: Significant token reduction leads to lower API costs
2. **Quality Maintenance**: Large model still handles final reasoning
3. **Scalability**: Small model handles bulk processing locally
4. **Measurable**: Built-in evaluation and comparison metrics

## Troubleshooting

### Common Issues

1. **Ollama Connection Error**: Ensure Ollama is running on localhost:11434
2. **Groq API Error**: Verify your API key is valid and has credits
3. **Model Not Found**: Run `ollama pull llama3` to download the model

### Debug Mode

Set logging level to DEBUG in main.py:

```python
logging.basicConfig(level=logging.DEBUG)
```

## Performance Expectations

- **Small contexts** (< 5k chars): Minimal improvement
- **Medium contexts** (5-20k chars): 30-50% token reduction  
- **Large contexts** (> 20k chars): 50-70% token reduction

The system automatically adapts processing based on context size and type.