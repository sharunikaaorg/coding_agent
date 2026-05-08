import type { TaskRequest, PipelineResult, EvaluationResult, HealthCheck } from '../types/api';

const API_BASE_URL = 'http://localhost:8006';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<HealthCheck> {
    return this.request<HealthCheck>('/health');
  }

  async runBaseline(taskRequest: TaskRequest): Promise<PipelineResult> {
    return this.request<PipelineResult>('/baseline', {
      method: 'POST',
      body: JSON.stringify(taskRequest),
    });
  }

  async runOptimized(taskRequest: TaskRequest): Promise<PipelineResult> {
    return this.request<PipelineResult>('/optimized', {
      method: 'POST',
      body: JSON.stringify(taskRequest),
    });
  }

  async evaluate(taskRequest: TaskRequest): Promise<EvaluationResult> {
    return this.request<EvaluationResult>('/evaluate', {
      method: 'POST',
      body: JSON.stringify(taskRequest),
    });
  }
}

export const apiService = new ApiService();