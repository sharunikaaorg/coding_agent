#!/usr/bin/env python3
"""
Setup and run script for the Context-Optimized Coding Agent Backend
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print("✅ Dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_path = Path(".env")
    
    if not env_path.exists():
        print("⚠️ .env file not found. Creating from template...")
        try:
            with open(".env.example", "r") as template:
                content = template.read()
            
            with open(".env", "w") as env_file:
                env_file.write(content)
            
            print("📝 Created .env file. Please edit it with your API keys:")
            print("   - GROQ_API_KEY: Get from https://console.groq.com")
            print("   - OLLAMA_BASE_URL: Should be http://localhost:11434")
            return False
        except Exception as e:
            print(f"❌ Could not create .env file: {e}")
            return False
    
    # Check if required variables are set
    from dotenv import load_dotenv
    load_dotenv()
    
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key or groq_key == "your_groq_api_key_here":
        print("❌ GROQ_API_KEY not set in .env file")
        return False
    
    print("✅ Environment variables configured")
    return True

def check_ollama():
    """Check if Ollama is running and has the required model"""
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    print("🔍 Checking Ollama service...")
    
    try:
        # Check if Ollama is running
        response = requests.get(f"{ollama_url}/api/tags", timeout=5)
        if response.status_code != 200:
            print("❌ Ollama server not responding")
            return False
        
        # Check if llama3 model is available
        models = response.json().get("models", [])
        model_names = [model["name"] for model in models]
        
        if "llama3" not in model_names:
            print("⚠️ llama3 model not found. Installing...")
            print("   Run: ollama pull llama3")
            return False
        
        print("✅ Ollama service ready with llama3 model")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Ollama. Is it running?")
        print("   Install from: https://ollama.ai")
        print("   Then run: ollama serve")
        return False
    except Exception as e:
        print(f"❌ Ollama check failed: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting Context-Optimized Coding Agent Backend...")
    print("   API will be available at: http://localhost:8000")
    print("   Docs available at: http://localhost:8000/docs")
    print("   Press Ctrl+C to stop")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Server failed to start: {e}")

def main():
    """Main setup and run function"""
    print("🎯 Context-Optimized Coding Agent Backend Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        return
    
    if not install_dependencies():
        return
    
    if not check_env_file():
        print("\n⚠️ Please configure your .env file and run this script again")
        return
    
    if not check_ollama():
        print("\n⚠️ Please set up Ollama and run this script again")
        return
    
    print("\n✅ All prerequisites met!")
    print("=" * 50)
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main()