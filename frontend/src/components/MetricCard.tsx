import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  suffix?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  suffix = '', 
  description,
  variant = 'default',
  icon 
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getChangeStyles = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className={`card p-6 hover:shadow-md transition-shadow ${getVariantStyles()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="text-gray-600">{icon}</div>}
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          
          <div className="flex items-baseline gap-1 mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${getChangeStyles()}`}>
              {getChangeIcon()}
              <span>
                {Math.abs(change).toFixed(1)}% {changeLabel || (change > 0 ? 'increase' : 'decrease')}
              </span>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}