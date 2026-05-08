
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true,
  variant = 'default',
  size = 'md'
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-primary-600';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-4';
      default:
        return 'h-2.5';
    }
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      
      <div className={`progress-bar ${getSizeStyles()}`}>
        <div 
          className={`progress-fill ${getVariantColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}