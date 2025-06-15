
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const LiquidationAlertSection: React.FC = () => {
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Liquidation Alerts</h3>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Market Cap {'>'} 500M</h4>
          <p className="text-sm text-gray-500">Liquidações acima de $200k USDT</p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Market Cap {'<'} 500M</h4>
          <p className="text-sm text-gray-500">Liquidações acima de $30k USDT</p>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p>Em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
};
