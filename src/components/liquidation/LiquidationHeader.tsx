
import React from 'react';
import { AlertTriangle, Database, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

export const LiquidationHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border-b border-gray-700 bg-gray-900/90 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg relative">
            <AlertTriangle className="w-5 h-5 text-white" />
            <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono">LIVE LIQUIDATIONS MONITOR 💥</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Ordenado por maior liquidação atual • Auto-remove após 15min sem atividade</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/database')}
            variant="outline"
            className="flex items-center space-x-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-cyan-400"
          >
            <Database className="w-4 h-4" />
            <span>DATABASE</span>
          </Button>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Long Liquidations</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Short Liquidations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
