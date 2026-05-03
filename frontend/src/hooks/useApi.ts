import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { TaskRequest, PipelineResult, EvaluationResult, HealthCheck } from '../types/api';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  return { ...state, execute };
}

export function useHealthCheck() {
  const api = useApi<HealthCheck>();
  
  const checkHealth = useCallback(() => {
    return api.execute(() => apiService.healthCheck());
  }, [api]);

  return { ...api, checkHealth };
}

export function usePipelineComparison() {
  const [baselineState, setBaselineState] = useState<UseApiState<PipelineResult>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const [optimizedState, setOptimizedState] = useState<UseApiState<PipelineResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const [evaluationState, setEvaluationState] = useState<UseApiState<EvaluationResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const runComparison = useCallback(async (taskRequest: TaskRequest) => {
    // Reset all states
    setBaselineState({ data: null, loading: true, error: null });
    setOptimizedState({ data: null, loading: true, error: null });
    setEvaluationState({ data: null, loading: true, error: null });

    try {
      // Run evaluation (which runs both pipelines)
      const evaluation = await apiService.evaluate(taskRequest);
      
      setBaselineState({ 
        data: evaluation.baseline_result, 
        loading: false, 
        error: null 
      });
      
      setOptimizedState({ 
        data: evaluation.optimized_result, 
        loading: false, 
        error: null 
      });
      
      setEvaluationState({ 
        data: evaluation, 
        loading: false, 
        error: null 
      });

      return evaluation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Comparison failed';
      
      setBaselineState({ data: null, loading: false, error: errorMessage });
      setOptimizedState({ data: null, loading: false, error: errorMessage });
      setEvaluationState({ data: null, loading: false, error: errorMessage });
      
      throw error;
    }
  }, []);

  const runIndividual = useCallback(async (taskRequest: TaskRequest, pipeline: 'baseline' | 'optimized') => {
    if (pipeline === 'baseline') {
      setBaselineState({ data: null, loading: true, error: null });
      try {
        const result = await apiService.runBaseline(taskRequest);
        setBaselineState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Baseline pipeline failed';
        setBaselineState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    } else {
      setOptimizedState({ data: null, loading: true, error: null });
      try {
        const result = await apiService.runOptimized(taskRequest);
        setOptimizedState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Optimized pipeline failed';
        setOptimizedState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    }
  }, []);

  return {
    baseline: baselineState,
    optimized: optimizedState,
    evaluation: evaluationState,
    runComparison,
    runIndividual,
    isLoading: baselineState.loading || optimizedState.loading || evaluationState.loading,
  };
}