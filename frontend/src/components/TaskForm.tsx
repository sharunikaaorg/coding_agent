import { useState } from 'react';
import { Play, Zap, BarChart3, Loader2 } from 'lucide-react';
import type { TaskRequest } from '../types/api';

interface TaskFormProps {
  onSubmit: (taskRequest: TaskRequest, mode: 'baseline' | 'optimized' | 'compare') => void;
  isLoading: boolean;
}

const EXAMPLE_TASKS = [
  {
    name: 'Debug Division by Zero',
    task: 'Find and fix the division by zero bug in this Python code',
    context: `def calculate_average(numbers):
    total = sum(numbers)
    average = total / len(numbers)  # Bug: doesn't handle empty list
    return average

def divide_numbers(a, b):
    return a / b  # Bug: doesn't handle b=0

# Test cases
print(calculate_average([1, 2, 3, 4, 5]))
print(calculate_average([]))  # This will crash
print(divide_numbers(10, 0))  # This will crash`
  },
  {
    name: 'Performance Issue',
    task: 'Identify performance bottlenecks in this data processing function',
    context: `import time

def process_data(data_list):
    results = []
    for item in data_list:
        # Inefficient: creating new list each time
        temp_list = []
        for i in range(1000):
            temp_list.append(item * i)
        
        # Inefficient: nested loops
        for i in range(len(temp_list)):
            for j in range(len(temp_list)):
                if i != j:
                    temp_list[i] += temp_list[j] * 0.001
        
        results.append(sum(temp_list))
        time.sleep(0.01)  # Unnecessary delay
    
    return results

# This will be very slow for large lists
large_data = list(range(100))
result = process_data(large_data)`
  },
  {
    name: 'Security Vulnerability',
    task: 'Find security vulnerabilities in this web application code',
    context: `import sqlite3
from flask import Flask, request

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    
    # SQL Injection vulnerability
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute(query)
    user = cursor.fetchone()
    
    if user:
        return f"Welcome {username}!"  # Information disclosure
    else:
        return "Invalid credentials"

@app.route('/file/<filename>')
def get_file(filename):
    # Path traversal vulnerability
    with open(f'/uploads/{filename}', 'r') as f:
        return f.read()`
  }
];

export function TaskForm({ onSubmit, isLoading }: TaskFormProps) {
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [selectedExample, setSelectedExample] = useState<string>('');

  const handleExampleSelect = (exampleName: string) => {
    const example = EXAMPLE_TASKS.find(ex => ex.name === exampleName);
    if (example) {
      setTask(example.task);
      setContext(example.context);
      setSelectedExample(exampleName);
    }
  };

  const handleSubmit = (mode: 'baseline' | 'optimized' | 'compare') => {
    if (!task.trim() || !context.trim()) {
      alert('Please provide both task and context');
      return;
    }

    onSubmit({ task: task.trim(), context: context.trim() }, mode);
  };

  const clearForm = () => {
    setTask('');
    setContext('');
    setSelectedExample('');
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Context-Optimized Coding Assistant</h2>
      
      {/* Example Tasks */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Examples
        </label>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TASKS.map((example) => (
            <button
              key={example.name}
              onClick={() => handleExampleSelect(example.name)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                selectedExample === example.name
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {example.name}
            </button>
          ))}
          {selectedExample && (
            <button
              onClick={clearForm}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Task Input */}
      <div className="mb-4">
        <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-2">
          Task Description
        </label>
        <input
          type="text"
          id="task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="e.g., Find the bug in this code, Optimize this function, Review security issues..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Context Input */}
      <div className="mb-6">
        <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
          Code/Context
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Paste your code, logs, or any relevant context here..."
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Characters: {context.length.toLocaleString()}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleSubmit('baseline')}
          disabled={isLoading || !task.trim() || !context.trim()}
          className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run Baseline Only
        </button>

        <button
          onClick={() => handleSubmit('optimized')}
          disabled={isLoading || !task.trim() || !context.trim()}
          className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Run Optimized Only
        </button>

        <button
          onClick={() => handleSubmit('compare')}
          disabled={isLoading || !task.trim() || !context.trim()}
          className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          Compare Both Pipelines
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> The optimized pipeline uses a small model (Ollama) to filter and compress your context, 
          then sends the relevant parts to the large model (Groq) for reasoning. This reduces tokens, cost, and processing time 
          while maintaining quality.
        </p>
      </div>
    </div>
  );
}