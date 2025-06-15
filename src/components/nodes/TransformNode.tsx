
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Filter, Shuffle, Calculator, Zap } from 'lucide-react';

interface TransformNodeProps {
  data: {
    label: string;
    transformType: 'clean' | 'filter' | 'aggregate' | 'join';
  };
}

const iconMap = {
  clean: Zap,
  filter: Filter,
  aggregate: Calculator,
  join: Shuffle,
};

const colorMap = {
  clean: 'green',
  filter: 'yellow',
  aggregate: 'purple',
  join: 'orange',
};

export const TransformNode: React.FC<TransformNodeProps> = ({ data }) => {
  const Icon = iconMap[data.transformType];
  const color = colorMap[data.transformType];

  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-${color}-200 hover:border-${color}-400 transition-colors min-w-[180px]`}>
      <div className="flex items-center space-x-2">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.transformType} Operation</div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className={`w-3 h-3 bg-${color}-500 border-2 border-white`}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 bg-${color}-500 border-2 border-white`}
      />
    </div>
  );
};
