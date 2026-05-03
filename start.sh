#!/bin/bash

echo "🎯 Context-Optimized Coding Agent - Full System Launcher"
echo "======================================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 &> /dev/null
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Python
if ! command_exists python3; then
    echo "❌ Python 3 is not installed"
    exit 1
fi
echo "✅ Python $(python3 --version | cut -d' ' -f2) found"

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✅ Node.js $(node --version) found"

# Check if Ollama is installed
if ! command_exists ollama; then
    echo "❌ Ollama is not installed. Please install from https://ollama.ai"
    exit 1
fi
echo "✅ Ollama found"

# Check if ports are available
if port_in_use 8000; then
    echo "⚠️ Port 8000 is already in use (backend)"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if port_in_use 3000; then
    echo "⚠️ Port 3000 is already in use (frontend)"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found"
    echo "Please create backend/.env with your Groq API key:"
    echo "  cp backend/.env.example backend/.env"
    echo "  # Edit backend/.env with your API key"
    exit 1
fi

# Source the .env file to check for API key
source backend/.env
if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "your_groq_api_key_here" ]; then
    echo "❌ GROQ_API_KEY not configured in backend/.env"
    echo "Please add your Groq API key to backend/.env"
    exit 1
fi
echo "✅ Groq API key configured"

# Start Ollama if not running
echo ""
echo "🔄 Starting services..."

if ! port_in_use 11434; then
    echo "Starting Ollama..."
    ollama serve &
    OLLAMA_PID=$!
    sleep 3
    
    # Pull model if needed
    if ! ollama list | grep -q "llama3"; then
        echo "Pulling llama3 model (this may take a while)..."
        ollama pull llama3
    fi
else
    echo "✅ Ollama already running"
fi

# Install backend dependencies if needed
echo "📦 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
echo "✅ Backend dependencies ready"

# Start backend
echo "🚀 Starting backend server..."
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Install frontend dependencies if needed
echo "📦 Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi
echo "✅ Frontend dependencies ready"

# Start frontend
echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..20}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Frontend is ready"
        break
    fi
    sleep 1
done

# Success message
echo ""
echo "🎉 Context-Optimized Coding Agent is now running!"
echo "================================================="
echo "🌐 Frontend Dashboard: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📖 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null
        echo "✅ Ollama stopped"
    fi
    
    echo "👋 Goodbye!"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Keep the script running
wait