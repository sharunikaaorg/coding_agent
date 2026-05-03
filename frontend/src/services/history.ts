export interface HistoryEntry {
  id: string;
  timestamp: string;
  task: string;
  fileNames: string[];
  baseline: { cost?: number; latency?: number; total_tokens?: number; model_calls?: number; output?: string } | null;
  optimized: { cost?: number; latency?: number; total_tokens?: number; model_calls?: number; output?: string; context_reduction?: number } | null;
  evaluation: {
    metrics?: {
      summary?: { token_reduction_percent?: number; cost_reduction_percent?: number; latency_improvement_percent?: number };
      quality?: { optimized_score?: number };
      recommendation?: string;
    };
  } | null;
}

const STORAGE_KEY = 'coding_agent_history';

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveEntry(entry: HistoryEntry): void {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
}

export function deleteEntry(id: string): void {
  const history = getHistory().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
