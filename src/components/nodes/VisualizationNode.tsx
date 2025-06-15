
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { BarChart3, PieChart, LineChart, Table2 } from 'lucide-react';

interface VisualizationNodeProps {
  data: {
    label: string;
    chartType: 'bar' | 'pie' | 'line' | 'table';
  };
}

const iconMap = {
  bar: BarChart3,
  pie: PieChart,
  line: LineChart,
  table: Table2,
};

export const VisualizationNode: React.FC<VisualizationNodeProps> = ({ data }) => {
  const Icon = iconMap[data.chartType];

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-indigo-200 hover:border-indigo-400 transition-colors min-w-[180px]">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.chartType} Chart</div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
    </div>
  );
};
