import { useState } from 'react';
import { 
  DollarSign, 
  Hash, 
  TrendingDown, 
  Award, 
  Copy, 
  CheckCircle,
  Eye,
  EyeOff 
} from 'lucide-react';
import type { PipelineResult, EvaluationResult } from '../types/api';
import { MetricCard } from './MetricCard';

interface ResultsDisplayProps {
  baseline?: PipelineResult | null;
  optimized?: PipelineResult | null;
  evaluation?: EvaluationResult | null;
}

export function ResultsDisplay({ baseline, optimized, evaluation }: ResultsDisplayProps) {
  const [copiedOutput, setCopiedOutput] = useState<string | null>(null);
  const [showFullOutput, setShowFullOutput] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOutput(label);
      setTimeout(() => setCopiedOutput(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleOutput = (key: string) => {
    setShowFullOutput(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const truncateOutput = (output: string, maxLength: number = 300) => {
    if (output.length <= maxLength) return output;
    return output.substring(0, maxLength) + '...';
  };

  if (!baseline && !optimized && !evaluation) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Hash className="w-16 h-16 mx-auto" />
        </div>
        <p className="text-gray-600">No results yet. Run a pipeline to see the comparison.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Metrics */}
      {evaluation && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Token Reduction"
            value={evaluation.metrics.summary.token_reduction_percent}
            suffix="%"
            variant="success"
            icon={<TrendingDown className="w-5 h-5" />}
            description="Tokens saved through optimization"
          />
          
          <MetricCard
            title="Cost Savings"
            value={evaluation.metrics.summary.cost_reduction_percent}
            suffix="%"
            variant="success"
            icon={<DollarSign className="w-5 h-5" />}
            description="Reduction in API costs"
          />
          
          <MetricCard
            title="Context Compression"
            value={evaluation.metrics.summary.context_reduction_percent}
            suffix="%"
            variant="default"
            icon={<Hash className="w-5 h-5" />}
            description="Input context reduced by filtering"
          />
          
          <MetricCard
            title="Quality Impact"
            value={evaluation.metrics.summary.quality_difference > 0 ? '+' : ''}
            change={evaluation.metrics.summary.quality_difference * 10}
            changeLabel="quality change"
            variant={evaluation.metrics.summary.quality_difference >= 0 ? 'success' : 'warning'}
            icon={<Award className="w-5 h-5" />}
            description="Change in output quality (1-10 scale)"
          />
        </div>
      )}

      {/* Recommendation */}
      {evaluation?.metrics.recommendation && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Recommendation</h3>
          <p className="text-blue-800">{evaluation.metrics.recommendation}</p>
        </div>
      )}

      {/* Individual Pipeline Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baseline Results */}
        {baseline && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Baseline Pipeline</h3>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Full Context → Groq
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tokens:</span>
                  <span className="ml-2 font-medium">{baseline.total_tokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cost:</span>
                  <span className="ml-2 font-medium">${baseline.cost.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Latency:</span>
                  <span className="ml-2 font-medium">{baseline.latency.toFixed(2)}s</span>
                </div>
                <div>
                  <span className="text-gray-500">Model Calls:</span>
                  <span className="ml-2 font-medium">{baseline.model_calls}</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Output</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleOutput('baseline')}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {showFullOutput.baseline ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showFullOutput.baseline ? 'Show Less' : 'Show More'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(baseline.output, 'baseline')}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {copiedOutput === 'baseline' ? 
                        <CheckCircle className="w-3 h-3" /> : 
                        <Copy className="w-3 h-3" />
                      }
                      {copiedOutput === 'baseline' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 text-sm font-mono max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {showFullOutput.baseline ? baseline.output : truncateOutput(baseline.output)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimized Results */}
        {optimized && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Optimized Pipeline</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Ollama Filter → Groq
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tokens:</span>
                  <span className="ml-2 font-medium">{optimized.total_tokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cost:</span>
                  <span className="ml-2 font-medium">${optimized.cost.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Latency:</span>
                  <span className="ml-2 font-medium">{optimized.latency.toFixed(2)}s</span>
                </div>
                <div>
                  <span className="text-gray-500">Model Calls:</span>
                  <span className="ml-2 font-medium">{optimized.model_calls}</span>
                </div>
              </div>

              {/* Context Reduction Progress */}
              {optimized.context_reduction && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Context Reduction</span>
                    <span className="text-sm text-gray-500">{optimized.context_reduction.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${optimized.context_reduction}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Output</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleOutput('optimized')}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {showFullOutput.optimized ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showFullOutput.optimized ? 'Show Less' : 'Show More'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(optimized.output, 'optimized')}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {copiedOutput === 'optimized' ? 
                        <CheckCircle className="w-3 h-3" /> : 
                        <Copy className="w-3 h-3" />
                      }
                      {copiedOutput === 'optimized' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 text-sm font-mono max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {showFullOutput.optimized ? optimized.output : truncateOutput(optimized.output)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}