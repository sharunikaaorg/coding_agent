import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { PerformanceMetrics, QualityEvaluation } from '../types/api';

interface ComparisonChartProps {
  performanceMetrics: PerformanceMetrics;
  qualityEvaluation: QualityEvaluation;
}

export function ComparisonChart({ performanceMetrics, qualityEvaluation }: ComparisonChartProps) {
  const performanceData = [
    {
      metric: 'Tokens',
      baseline: performanceMetrics.token_metrics.baseline_tokens,
      optimized: performanceMetrics.token_metrics.optimized_tokens,
      unit: 'tokens',
    },
    {
      metric: 'Cost',
      baseline: performanceMetrics.cost_metrics.baseline_cost,
      optimized: performanceMetrics.cost_metrics.optimized_cost,
      unit: '$',
    },
    {
      metric: 'Latency',
      baseline: performanceMetrics.performance_metrics.baseline_latency,
      optimized: performanceMetrics.performance_metrics.optimized_latency,
      unit: 's',
    },
  ];

  const qualityData = Object.entries(qualityEvaluation.criteria_scores).map(([criteria, scores]) => ({
    criteria: criteria.charAt(0).toUpperCase() + criteria.slice(1),
    baseline: scores.baseline,
    optimized: scores.optimized,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value.toFixed(entry.dataKey === 'Cost' ? 4 : 2)}
              {data.unit && ` ${data.unit}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Performance Comparison */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="baseline" 
              fill="#ef4444" 
              name="Baseline Pipeline"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="optimized" 
              fill="#10b981" 
              name="Optimized Pipeline"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quality Radar Chart */}
      {qualityData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={qualityData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="criteria" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 10]} 
                tick={{ fontSize: 10 }}
              />
              <Radar
                name="Baseline"
                dataKey="baseline"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Optimized"
                dataKey="optimized"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Quality Analysis:</strong> {qualityEvaluation.analysis}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}