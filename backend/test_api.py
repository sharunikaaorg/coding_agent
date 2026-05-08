#!/usr/bin/env python3
"""
Test script for the Context-Optimized Coding Agent API
"""

import requests
import json
import time
from typing import Dict, Any

API_BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Groq: {data['services']['groq']['status']}")
            print(f"   Ollama: {data['services']['ollama']['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_baseline_pipeline():
    """Test baseline pipeline"""
    print("\n🧪 Testing baseline pipeline...")
    
    test_request = {
        "task": "Find the bug in this Python function",
        "context": """
def divide_numbers(a, b):
    result = a / b
    return result

def calculate_average(numbers):
    total = sum(numbers)
    average = total / len(numbers)
    return average

# Test the functions
print(divide_numbers(10, 2))
print(calculate_average([1, 2, 3, 4, 5]))
print(divide_numbers(5, 0))  # This will cause an error
"""
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{API_BASE_URL}/baseline", json=test_request)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Baseline pipeline successful")
            print(f"   Latency: {end_time - start_time:.2f}s")
            print(f"   Total tokens: {data['total_tokens']}")
            print(f"   Cost: ${data['cost']:.4f}")
            print(f"   Output preview: {data['output'][:100]}...")
            return data
        else:
            print(f"❌ Baseline pipeline failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Baseline pipeline error: {e}")
        return None

def test_optimized_pipeline():
    """Test optimized pipeline"""
    print("\n⚡ Testing optimized pipeline...")
    
    test_request = {
        "task": "Find the bug in this Python function",
        "context": """
def divide_numbers(a, b):
    result = a / b
    return result

def calculate_average(numbers):
    total = sum(numbers)
    average = total / len(numbers)
    return average

# Test the functions
print(divide_numbers(10, 2))
print(calculate_average([1, 2, 3, 4, 5]))
print(divide_numbers(5, 0))  # This will cause an error

# Additional context (should be filtered out)
import os
import sys
import datetime

# Logging configuration
logging_config = {
    "version": 1,
    "handlers": {
        "file": {
            "class": "logging.FileHandler",
            "filename": "app.log"
        }
    }
}

# Database connection (not relevant to the bug)
DATABASE_URL = "postgresql://user:pass@localhost/db"

class DatabaseManager:
    def __init__(self, url):
        self.url = url
    
    def connect(self):
        pass
    
    def disconnect(self):
        pass
"""
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{API_BASE_URL}/optimized", json=test_request)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Optimized pipeline successful")
            print(f"   Latency: {end_time - start_time:.2f}s")
            print(f"   Total tokens: {data['total_tokens']}")
            print(f"   Cost: ${data['cost']:.4f}")
            print(f"   Context reduction: {data.get('context_reduction', 0):.1f}%")
            print(f"   Output preview: {data['output'][:100]}...")
            return data
        else:
            print(f"❌ Optimized pipeline failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Optimized pipeline error: {e}")
        return None

def test_evaluation():
    """Test evaluation endpoint"""
    print("\n📊 Testing evaluation endpoint...")
    
    test_request = {
        "task": "Find and fix the division by zero bug",
        "context": """
def safe_divide(a, b):
    if b == 0:
        return None
    return a / b

def risky_divide(a, b):
    return a / b  # No error checking

# Usage examples
print(safe_divide(10, 2))    # Works fine
print(risky_divide(10, 2))   # Works fine
print(safe_divide(10, 0))    # Returns None
print(risky_divide(10, 0))   # Will crash!
"""
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{API_BASE_URL}/evaluate", json=test_request)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            metrics = data['metrics']
            
            print("✅ Evaluation successful")
            print(f"   Total time: {end_time - start_time:.2f}s")
            
            # Performance metrics
            perf = metrics['performance']
            print(f"\n📈 Performance Comparison:")
            print(f"   Token reduction: {perf['token_metrics']['token_reduction_percent']:.1f}%")
            print(f"   Cost savings: {perf['cost_metrics']['cost_reduction_percent']:.1f}%")
            print(f"   Latency change: {perf['performance_metrics']['latency_improvement_percent']:.1f}%")
            
            # Quality metrics
            quality = metrics['quality']
            print(f"\n🎯 Quality Comparison:")
            print(f"   Baseline score: {quality['baseline_score']:.1f}/10")
            print(f"   Optimized score: {quality['optimized_score']:.1f}/10")
            
            # Recommendation
            if 'summary' in metrics:
                print(f"\n💡 Recommendation:")
                print(f"   {metrics.get('recommendation', 'No recommendation available')}")
            
            return data
        else:
            print(f"❌ Evaluation failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Evaluation error: {e}")
        return None

def main():
    """Run all tests"""
    print("🧪 Context-Optimized Coding Agent - API Tests")
    print("=" * 60)
    
    # Test health
    if not test_health():
        print("\n❌ Health check failed. Is the server running?")
        return
    
    # Test individual pipelines
    baseline_result = test_baseline_pipeline()
    optimized_result = test_optimized_pipeline()
    
    # Test evaluation
    evaluation_result = test_evaluation()
    
    print("\n" + "=" * 60)
    if baseline_result and optimized_result and evaluation_result:
        print("✅ All tests passed!")
        print("\n🎯 Quick Summary:")
        print(f"   Backend: Ready")
        print(f"   Groq Integration: Working") 
        print(f"   Ollama Integration: Working")
        print(f"   Context Processing: Working")
        print(f"   Evaluation: Working")
        print(f"\n🚀 Ready for frontend integration!")
    else:
        print("❌ Some tests failed. Check the error messages above.")

if __name__ == "__main__":
    main()