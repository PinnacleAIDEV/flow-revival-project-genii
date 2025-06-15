
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, FileText, Globe, Server } from 'lucide-react';

interface DataSourceNodeProps {
  data: {
    label: string;
    sourceType: 'csv' | 'database' | 'api' | 'json';
  };
}

const iconMap = {
  csv: FileText,
  database: Database,
  api: Globe,
  json: Server,
};

export const DataSourceNode: React.FC<DataSourceNodeProps> = ({ data }) => {
  const Icon = iconMap[data.sourceType];

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-blue-200 hover:border-blue-400 transition-colors min-w-[180px]">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.sourceType} Source</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};
