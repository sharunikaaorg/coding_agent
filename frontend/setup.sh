#!/bin/bash

echo "🎯 Setting up Context-Optimized Coding Agent Frontend"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if backend is running
echo "🔍 Checking backend connection..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running and accessible"
else
    echo "⚠️ Backend is not running. Please start the backend first:"
    echo "   cd ../backend && python run.py"
fi

echo ""
echo "🚀 Frontend setup complete!"
echo "   Start development: npm run dev"
echo "   Frontend will be at: http://localhost:3000"
echo "   Backend should be at: http://localhost:8000"
echo ""