
import React from 'react';
import { DollarSign } from 'lucide-react';

export const LargeOrderSection: React.FC = () => {
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Large Orders</h3>
        <div className="text-sm text-gray-500">{'>'} $1M</div>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p>Em desenvolvimento...</p>
        <p className="text-xs mt-2">Ordens únicas maiores que $1M</p>
      </div>
    </div>
  );
};
