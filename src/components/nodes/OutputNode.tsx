
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Download, Share, Mail, FileOutput } from 'lucide-react';

interface OutputNodeProps {
  data: {
    label: string;
    outputType: 'download' | 'share' | 'email' | 'export';
  };
}

const iconMap = {
  download: Download,
  share: Share,
  email: Mail,
  export: FileOutput,
};

export const OutputNode: React.FC<OutputNodeProps> = ({ data }) => {
  const Icon = iconMap[data.outputType];

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-red-200 hover:border-red-400 transition-colors min-w-[180px]">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-red-100 rounded-lg">
          <Icon className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.outputType} Output</div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
    </div>
  );
};
