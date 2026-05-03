# Context-Optimized Coding Agent

A multi-model coding assistant that demonstrates significant efficiency gains through intelligent context processing.

## 🎯 Project Overview

This project implements a **two-pipeline approach** to coding assistance:

1. **Baseline Pipeline**: Full context → Groq LLaMA3-70B
2. **Optimized Pipeline**: Context → Ollama LLaMA3-8B (filter) → Groq LLaMA3-70B (reason)

The system proves measurable improvements in cost, token usage, and efficiency while maintaining output quality.

## 🏗️ Architecture

```
User Input (Task + Context)
         ↓
    ┌─────────────┐    ┌──────────────┐
    │  Baseline   │    │  Optimized   │
    │  Pipeline   │    │   Pipeline   │
    └─────────────┘    └──────────────┘
         ↓                     ↓
    Full Context         Ollama Filter
         ↓                     ↓
     Groq API           Filtered Context
         ↓                     ↓
      Output              Groq API
         ↓                     ↓
    ┌─────────────────────────────┐
    │     Evaluation Engine       │
    │   • Token reduction         │
    │   • Cost savings           │
    │   • Quality comparison     │
    │   • Performance metrics    │
    └─────────────────────────────┘
```

## 📊 Expected Results

- **Token Reduction**: 40-70% typical reduction
- **Cost Savings**: Proportional to token reduction  
- **Quality**: Maintained or improved through focused reasoning
- **Latency**: Variable (filtering overhead vs. reduced processing)

## 🚀 Quick Start

### One-Command Launch (Recommended)

```bash
# Launch the entire system
./start.sh
```

This script will:
- ✅ Check all prerequisites (Python, Node.js, Ollama)
- ✅ Set up and start Ollama with LLaMA3 model
- ✅ Install backend dependencies and start API server
- ✅ Install frontend dependencies and start dashboard
- ✅ Verify all services are running correctly

**Access Points:**
- 🌐 **Frontend Dashboard**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000  
- 📖 **API Docs**: http://localhost:8000/docs

### Manual Setup (Alternative)

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your Groq API key

# Install and start Ollama
# Download from https://ollama.ai
ollama serve
ollama pull llama3

# Run the backend
python run.py
```

#### 2. Test the API

```bash
cd backend
python test_api.py
```

#### 3. Frontend Setup

```bash
cd frontend

# Run setup script (recommended)
./setup.sh

# OR install manually
npm install
npm run dev
```

## 📁 Project Structure

```
coding_agent/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main FastAPI app
│   ├── models/             # Pydantic models
│   │   └── schemas.py      # Request/response schemas
│   ├── services/           # Core services
│   │   ├── groq_service.py       # Groq API integration
│   │   ├── ollama_service.py     # Ollama integration
│   │   ├── context_processor.py  # Context filtering
│   │   └── evaluation_engine.py  # Performance evaluation
│   ├── requirements.txt    # Python dependencies
│   ├── run.py             # Setup and run script
│   ├── test_api.py        # API test suite
│   └── README.md          # Backend documentation
├── frontend/              # React + Vite dashboard
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API integration
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Main application
│   ├── public/               # Static assets
│   ├── index.html           # HTML template
│   ├── package.json         # Dependencies
│   └── setup.sh            # Setup script
└── README.md             # This file
```

## 🧠 Core Components

### 1. Groq Service
- **Purpose**: Large model reasoning and final output
- **Model**: LLaMA3-70B via Groq API
- **Features**: Token counting, cost calculation, health monitoring

### 2. Ollama Service  
- **Purpose**: Small model context filtering
- **Model**: LLaMA3-8B running locally
- **Features**: Context analysis, smart filtering, chunk processing

### 3. Context Processor
- **Purpose**: Intelligent context optimization
- **Features**: 
  - Code/log/error detection
  - Relevance filtering
  - Large context chunking
  - Reduction metrics

### 4. Evaluation Engine
- **Purpose**: Performance comparison and quality assessment
- **Features**:
  - Token/cost metrics
  - LLM-as-judge quality evaluation
  - Performance recommendations

## 🎛️ API Endpoints

### Health Check
```http
GET /health
```

### Run Baseline Pipeline
```http
POST /baseline
{
  "task": "Find the bug in this code",
  "context": "def calculate(x, y): return x / y"
}
```

### Run Optimized Pipeline
```http
POST /optimized
{
  "task": "Find the bug in this code", 
  "context": "def calculate(x, y): return x / y"
}
```

### Compare Both Pipelines
```http
POST /evaluate
{
  "task": "Find the bug in this code",
  "context": "def calculate(x, y): return x / y"
}
```

## 📈 Metrics Tracked

### Performance Metrics
- **Token Reduction %**: How much context was compressed
- **Cost Reduction %**: Proportional cost savings
- **Latency Change**: Processing time difference
- **Model Calls**: Number of API calls made

### Quality Metrics
- **Correctness**: How accurate is the response (1-10)
- **Completeness**: Does it fully address the task (1-10)
- **Clarity**: How well explained (1-10)
- **Practicality**: How actionable (1-10)

## 🔧 Configuration

### Environment Variables
```env
GROQ_API_KEY=your_groq_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
```

### Model Configuration
- **Large Model**: LLaMA3-70B (Groq)
- **Small Model**: LLaMA3-8B (Ollama)
- **Fallback**: Automatic fallbacks on service failures

## 🎯 Use Cases

### Ideal for Context Optimization:
- **Large codebases** with debugging tasks
- **Log analysis** with specific error hunting
- **Code reviews** with focused improvements
- **Documentation** with relevant section extraction

### Less Effective for:
- **Small contexts** (< 5k characters)
- **Highly interconnected code** requiring full context
- **Creative tasks** needing broad context understanding

## 🚧 Current Status

### ✅ Completed (Backend)
- [x] FastAPI backend with all endpoints
- [x] Groq API integration (large model)
- [x] Ollama integration (small model)  
- [x] Context processing and filtering
- [x] Evaluation engine with quality assessment
- [x] Health monitoring and error handling
- [x] Comprehensive testing suite
- [x] Setup and deployment scripts

### ✅ Completed (Frontend)
- [x] React + Vite frontend with TypeScript
- [x] Interactive dashboard with metrics visualization  
- [x] Task input form with example scenarios
- [x] Real-time pipeline comparison
- [x] Performance charts and quality radar plots
- [x] Backend health monitoring
- [x] Responsive design for all screen sizes

### 🎯 Future Enhancements
- [ ] Multiple model support (GPT, Claude, etc.)
- [ ] Advanced context strategies (RAG, embeddings)
- [ ] Batch processing capabilities
- [ ] Performance monitoring dashboard
- [ ] A/B testing framework

## 📊 Expected Performance

| Context Size | Token Reduction | Cost Savings | Quality Impact |
|-------------|----------------|--------------|----------------|
| Small (< 5k) | 10-20% | 10-20% | Neutral |
| Medium (5-20k) | 30-50% | 30-50% | Neutral/Positive |
| Large (> 20k) | 50-70% | 50-70% | Positive |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Ready to build the frontend?** The backend is production-ready and waiting for a beautiful dashboard to showcase the performance improvements!