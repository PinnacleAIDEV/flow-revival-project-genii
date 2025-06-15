
import React from 'react';
import { Volume2 } from 'lucide-react';

export const TopVolumeSection: React.FC = () => {
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top 40 Volume</h3>
        <div className="text-sm text-gray-500">24h Futures</div>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        <Volume2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p>Em desenvolvimento...</p>
        <p className="text-xs mt-2">Top 40 maiores volumes diários em futuros</p>
      </div>
    </div>
  );
};
