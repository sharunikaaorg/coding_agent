import { useState } from 'react';
import type { HistoryEntry } from '../services/history';
import { getHistory, deleteEntry, clearHistory } from '../services/history';

interface HistoryProps {
  onBack: () => void;
}

export default function History({ onBack }: HistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>(getHistory);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setEntries(getHistory());
  };

  const handleClear = () => {
    if (confirm('Clear all history?')) {
      clearHistory();
      setEntries([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📜 Query History</h1>
          <div className="flex gap-3">
            <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            {entries.length > 0 && (
              <button onClick={handleClear} className="px-4 py-2 text-red-600 hover:text-red-800">
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No history yet. Run an analysis to see results here.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-lg shadow">
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{entry.task}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(entry.timestamp).toLocaleString()} · {entry.fileNames.length} file(s): {entry.fileNames.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {entry.evaluation?.metrics?.summary && (
                      <div className="flex gap-3 text-xs">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          📉 {entry.evaluation.metrics.summary.token_reduction_percent?.toFixed(1)}% tokens saved
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          💰 {entry.evaluation.metrics.summary.cost_reduction_percent?.toFixed(1)}% cost saved
                        </span>
                      </div>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      ✕
                    </button>
                    <span className="text-gray-400">{expanded === entry.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === entry.id && (
                  <div className="border-t px-5 pb-5 pt-4">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Baseline */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full" /> Baseline
                        </h4>
                        {entry.baseline ? (
                          <div className="text-sm space-y-1 text-gray-600">
                            <div>💰 Cost: ${entry.baseline.cost?.toFixed(4) ?? 'N/A'}</div>
                            <div>⚡ Latency: {entry.baseline.latency?.toFixed(2) ?? 'N/A'}s</div>
                            <div>🔢 Tokens: {entry.baseline.total_tokens?.toLocaleString() ?? 'N/A'}</div>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600">View output</summary>
                              <pre className="mt-2 bg-gray-50 p-3 rounded text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {entry.baseline.output}
                              </pre>
                            </details>
                          </div>
                        ) : <p className="text-sm text-gray-400">Not run</p>}
                      </div>

                      {/* Optimized */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full" /> Optimized
                        </h4>
                        {entry.optimized ? (
                          <div className="text-sm space-y-1 text-gray-600">
                            <div>💰 Cost: ${entry.optimized.cost?.toFixed(4) ?? 'N/A'}</div>
                            <div>⚡ Latency: {entry.optimized.latency?.toFixed(2) ?? 'N/A'}s</div>
                            <div>🔢 Tokens: {entry.optimized.total_tokens?.toLocaleString() ?? 'N/A'}</div>
                            {entry.optimized.context_reduction != null && (
                              <div>📦 Context Reduction: {entry.optimized.context_reduction.toFixed(1)}%</div>
                            )}
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600">View output</summary>
                              <pre className="mt-2 bg-gray-50 p-3 rounded text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {entry.optimized.output}
                              </pre>
                            </details>
                          </div>
                        ) : <p className="text-sm text-gray-400">Not run</p>}
                      </div>
                    </div>

                    {/* Evaluation metrics */}
                    {entry.evaluation?.metrics && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3">📈 Evaluation</h4>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="bg-green-50 p-3 rounded text-center">
                            <div className="text-green-800 font-semibold">
                              {entry.evaluation.metrics.summary?.token_reduction_percent?.toFixed(1) ?? 'N/A'}%
                            </div>
                            <div className="text-green-600 text-xs">Token Reduction</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded text-center">
                            <div className="text-blue-800 font-semibold">
                              {entry.evaluation.metrics.summary?.cost_reduction_percent?.toFixed(1) ?? 'N/A'}%
                            </div>
                            <div className="text-blue-600 text-xs">Cost Savings</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded text-center">
                            <div className="text-purple-800 font-semibold">
                              {entry.evaluation.metrics.summary?.latency_improvement_percent?.toFixed(1) ?? 'N/A'}%
                            </div>
                            <div className="text-purple-600 text-xs">Latency Improvement</div>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded text-center">
                            <div className="text-yellow-800 font-semibold">
                              {entry.evaluation.metrics.quality?.optimized_score?.toFixed(1) ?? 'N/A'}/10
                            </div>
                            <div className="text-yellow-600 text-xs">Quality Score</div>
                          </div>
                        </div>
                        {entry.evaluation.metrics.recommendation && (
                          <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            🎯 {entry.evaluation.metrics.recommendation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
