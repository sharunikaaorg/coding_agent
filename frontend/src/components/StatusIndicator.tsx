import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import type { HealthCheck } from '../types/api';

interface StatusIndicatorProps {
  health: HealthCheck | null;
  loading: boolean;
  onRefresh: () => void;
}

export function StatusIndicator({ health, loading, onRefresh }: StatusIndicatorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4" />;
      case 'unhealthy':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Checking status...</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-red-600 bg-red-100 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Disconnected</span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Overall Status */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${getStatusColor(health.status)}`}>
          {getStatusIcon(health.status)}
          <span className="capitalize">{health.status}</span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Service Details */}
      <div className="hidden sm:flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Groq:</span>
          <div className={`w-2 h-2 rounded-full ${
            health.services.groq.status === 'healthy' ? 'bg-green-400' : 
            health.services.groq.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <span className={`${
            health.services.groq.status === 'healthy' ? 'text-green-600' : 
            health.services.groq.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {health.services.groq.status}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Ollama:</span>
          <div className={`w-2 h-2 rounded-full ${
            health.services.ollama.status === 'healthy' ? 'bg-green-400' : 
            health.services.ollama.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <span className={`${
            health.services.ollama.status === 'healthy' ? 'text-green-600' : 
            health.services.ollama.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {health.services.ollama.status}
          </span>
        </div>
      </div>
    </div>
  );
}