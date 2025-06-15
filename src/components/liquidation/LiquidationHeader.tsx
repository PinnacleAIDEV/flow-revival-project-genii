
import React from 'react';
import { AlertTriangle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

export const LiquidationHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-600 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Live Liquidations Monitor</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Sorted by highest total liquidated • Auto-remove after 15min of inactivity</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/database')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Database</span>
          </Button>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Long Liquidations</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Short Liquidations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
