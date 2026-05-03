import React, { useState, useEffect } from 'react';

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

interface AnalysisResult {
  id: string;
  timestamp: string;
  task: string;
  files: UploadedFile[];
  baseline: any;
  optimized: any;
  evaluation?: any;
}

type ViewMode = 'upload' | 'results' | 'evaluation' | 'history';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [task, setTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [baselineResult, setBaselineResult] = useState<any>(null);
  const [optimizedResult, setOptimizedResult] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);

  // Load history from localStorage on component mount
  useEffect(() => {
    console.log('Loading history from localStorage...');
    const savedHistory = localStorage.getItem('analysis-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        console.log('Loaded history:', parsedHistory.length, 'items');
      } catch (error) {
        console.error('Error parsing history:', error);
      }
    } else {
      console.log('No history found in localStorage');
    }
  }, []);

  // Save to history
  const saveToHistory = (result: AnalysisResult) => {
    console.log('Saving to history:', result);
    const newHistory = [result, ...history.slice(0, 9)]; // Keep last 10
    setHistory(newHistory);
    localStorage.setItem('analysis-history', JSON.stringify(newHistory));
    console.log('History saved, total items:', newHistory.length);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all analysis history?')) {
      setHistory([]);
      localStorage.removeItem('analysis-history');
      console.log('History cleared');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile: UploadedFile = {
          name: file.name,
          content: content,
          size: file.size
        };
        
        setFiles(prev => [...prev, newFile]);
      };
      reader.readAsText(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!task.trim() || files.length === 0) {
      alert('Please provide a task description and upload at least one file');
      return;
    }

    setIsLoading(true);
    
    const combinedContext = files.map(file => 
      `File: ${file.name}\n${file.content}`
    ).join('\n\n');

    try {
      const [baselineRes, optimizedRes] = await Promise.all([
        fetch('http://localhost:8006/baseline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, context: combinedContext })
        }),
        fetch('http://localhost:8006/optimized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, context: combinedContext })
        })
      ]);

      const baseline = await baselineRes.json();
      const optimized = await optimizedRes.json();
      
      setBaselineResult(baseline);
      setOptimizedResult(optimized);
      
      // Create analysis result for history
      const analysisResult: AnalysisResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        task,
        files: [...files],
        baseline,
        optimized
      };
      
      setCurrentAnalysis(analysisResult);
      
      // Save to history immediately
      const newHistory = [analysisResult, ...history.slice(0, 9)];
      setHistory(newHistory);
      localStorage.setItem('analysis-history', JSON.stringify(newHistory));
      
      setViewMode('results');
      
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setIsLoading(true);
    
    try {
      const combinedContext = files.map(file => 
        `File: ${file.name}\n${file.content}`
      ).join('\n\n');

      const response = await fetch('http://localhost:8006/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, context: combinedContext })
      });

      const evaluation = await response.json();
      setEvaluationData(evaluation);
      
      // Update current analysis with evaluation
      if (currentAnalysis) {
        const updatedAnalysis = { ...currentAnalysis, evaluation };
        setCurrentAnalysis(updatedAnalysis);
        saveToHistory(updatedAnalysis);
      }
      
      setViewMode('evaluation');
      
    } catch (error) {
      console.error('Evaluation failed:', error);
      alert('Evaluation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: AnalysisResult) => {
    setTask(item.task);
    setFiles(item.files);
    setBaselineResult(item.baseline);
    setOptimizedResult(item.optimized);
    setEvaluationData(item.evaluation);
    setCurrentAnalysis(item);
    setViewMode(item.evaluation ? 'evaluation' : 'results');
  };

  const resetToUpload = () => {
    setViewMode('upload');
    setFiles([]);
    setTask('');
    setBaselineResult(null);
    setOptimizedResult(null);
    setEvaluationData(null);
    setCurrentAnalysis(null);
  };

  // Header Component with Navigation
  const Header = () => (
    <header className="bg-white border-b border-gray-100 px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Context Optimizer</h1>
              <p className="text-sm text-gray-500">AI-powered code analysis platform</p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'upload' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Upload
            </button>
            
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                viewMode === 'history' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History ({history.length})</span>
            </button>
            
            {(baselineResult || optimizedResult) && (
              <button
                onClick={() => setViewMode('results')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'results' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Results
              </button>
            )}
          </nav>
        </div>
        
        
      </div>
    </header>
  );

  // Upload View
  if (viewMode === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">New Analysis</h2>
              <p className="text-gray-600 mt-1">Upload your code files and describe the analysis task</p>
            </div>
            
            <div className="px-8 py-8 space-y-8">
              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Code Files
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".js,.ts,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.html,.css,.json,.xml,.yaml,.yml"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-gray-900 font-medium">Click to upload files</div>
                    <div className="text-gray-500 text-sm mt-1">or drag and drop</div>
                    <div className="text-xs text-gray-400 mt-2">Supports: JS, TS, Python, Java, C++, Go, Rust, PHP, Ruby, Swift, Kotlin</div>
                  </label>
                </div>

                {/* Uploaded Files List */}
                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="text-sm font-medium text-gray-900">
                      Uploaded Files ({files.length})
                    </div>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{file.name}</div>
                            <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Analysis Task
                </label>
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Describe what you want to analyze (e.g., find bugs, optimize performance, review security issues...)"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading || !task.trim() || files.length === 0}
                className={`w-full py-4 px-6 rounded-xl font-medium transition-all ${
                  isLoading || !task.trim() || files.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Start Analysis'
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // History View
  if (viewMode === 'history') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-6xl mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Analysis History</h2>
                <p className="text-gray-600 mt-1">Your recent code analysis sessions ({history.length} total)</p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="p-8">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis history</h3>
                  <p className="text-gray-500 mb-6">Upload some files and run an analysis to see history here</p>
                  <button
                    onClick={() => setViewMode('upload')}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Create New Analysis
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div 
                      key={item.id}
                      className="border border-gray-100 rounded-xl p-6 hover:shadow-md hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">{item.task}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                            <span>{item.files.length} files</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.files.slice(0, 3).map((file, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {file.name}
                              </span>
                            ))}
                            {item.files.length > 3 && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{item.files.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => loadFromHistory(item)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm ml-6"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Results View - Split Screen
  if (viewMode === 'results') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="border-b border-gray-100 bg-white px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
              <p className="text-sm text-gray-600">{task}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={resetToUpload}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                New Analysis
              </button>
              <button
                onClick={handleEvaluate}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Evaluating...' : 'Evaluate & Compare'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 min-h-[calc(100vh-200px)]">
          {/* Baseline Results */}
          <div className="bg-white border-r border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Baseline Pipeline</h3>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  Groq Direct
                </span>
              </div>
              {baselineResult && (
                <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">${baselineResult.cost?.toFixed(4) || 'N/A'}</div>
                    <div className="text-gray-500">Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{baselineResult.latency?.toFixed(2) || 'N/A'}s</div>
                    <div className="text-gray-500">Time</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{baselineResult.total_tokens?.toLocaleString() || 'N/A'}</div>
                    <div className="text-gray-500">Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{baselineResult.model_calls || 'N/A'}</div>
                    <div className="text-gray-500">Calls</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 h-full overflow-y-auto">
              <div className="bg-gray-50 rounded-xl p-4 min-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {baselineResult?.output || 'Loading baseline results...'}
                </pre>
              </div>
            </div>
          </div>

          {/* Optimized Results */}
          <div className="bg-white">
            <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Optimized Pipeline</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Ollama + Groq
                </span>
              </div>
              {optimizedResult && (
                <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">${optimizedResult.cost?.toFixed(4) || 'N/A'}</div>
                    <div className="text-gray-500">Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{optimizedResult.latency?.toFixed(2) || 'N/A'}s</div>
                    <div className="text-gray-500">Time</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{optimizedResult.total_tokens?.toLocaleString() || 'N/A'}</div>
                    <div className="text-gray-500">Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{optimizedResult.model_calls || 'N/A'}</div>
                    <div className="text-gray-500">Calls</div>
                  </div>
                </div>
              )}
              
              {optimizedResult?.context_reduction && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Context Reduction</span>
                    <span className="font-medium">{optimizedResult.context_reduction.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${optimizedResult.context_reduction}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 h-full overflow-y-auto">
              <div className="bg-gray-50 rounded-xl p-4 min-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {optimizedResult?.output || 'Loading optimized results...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Evaluation View
  if (viewMode === 'evaluation') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-8 py-12">
          <div className="mb-8">
            <button
              onClick={() => setViewMode('results')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Results</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Performance Evaluation</h1>
            <p className="text-gray-600 mt-2">Comprehensive analysis of both pipelines</p>
          </div>

          {evaluationData && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Token Reduction',
                    value: `${evaluationData.metrics?.summary?.token_reduction_percent?.toFixed(1) || 'N/A'}%`,
                    icon: '📉',
                    color: 'green'
                  },
                  {
                    title: 'Cost Savings',
                    value: `${evaluationData.metrics?.summary?.cost_reduction_percent?.toFixed(1) || 'N/A'}%`,
                    icon: '💰',
                    color: 'blue'
                  },
                  {
                    title: 'Latency Change',
                    value: `${evaluationData.metrics?.summary?.latency_improvement_percent?.toFixed(1) || 'N/A'}%`,
                    icon: '⚡',
                    color: 'purple'
                  },
                  {
                    title: 'Quality Score',
                    value: `${evaluationData.metrics?.quality?.optimized_score?.toFixed(1) || 'N/A'}/10`,
                    icon: '🏆',
                    color: 'yellow'
                  }
                ].map((metric, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-${metric.color}-100 rounded-xl flex items-center justify-center text-xl`}>
                        {metric.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">{metric.title}</div>
                        <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              {evaluationData.metrics?.recommendation && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Recommendation</h3>
                  <p className="text-blue-800 leading-relaxed">{evaluationData.metrics.recommendation}</p>
                </div>
              )}

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Token Usage Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Baseline Tokens</span>
                      <span className="font-medium">{evaluationData.metrics?.performance?.token_metrics?.baseline_tokens?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Optimized Tokens</span>
                      <span className="font-medium">{evaluationData.metrics?.performance?.token_metrics?.optimized_tokens?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-medium text-green-600">Tokens Saved</span>
                      <span className="font-bold text-green-600">{evaluationData.metrics?.performance?.token_metrics?.tokens_saved?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Cost Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Baseline Cost</span>
                      <span className="font-medium">${evaluationData.metrics?.performance?.cost_metrics?.baseline_cost?.toFixed(4) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Optimized Cost</span>
                      <span className="font-medium">${evaluationData.metrics?.performance?.cost_metrics?.optimized_cost?.toFixed(4) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-medium text-green-600">Cost Saved</span>
                      <span className="font-bold text-green-600">${evaluationData.metrics?.performance?.cost_metrics?.cost_saved?.toFixed(4) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unknown View</h2>
          <p className="text-gray-600">Something went wrong. Please go back to upload.</p>
          <button
            onClick={() => setViewMode('upload')}
            className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Back to Upload
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;