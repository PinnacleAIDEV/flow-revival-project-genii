
import React from 'react';
import { AlertTriangle, Zap, Activity } from 'lucide-react';
import { Badge } from '../ui/badge';

interface RealLiquidationAlertProps {
  ticker: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  intensity: number;
  isReal: boolean;
  source: 'FORCE_ORDER' | 'PRICE_ANALYSIS';
  timestamp: number;
  onClick?: () => void;
}

export const RealLiquidationAlert: React.FC<RealLiquidationAlertProps> = ({
  ticker,
  type,
  amount,
  price,
  intensity,
  isReal,
  source,
  timestamp,
  onClick
}) => {
  const formatAmount = (amount: number) => {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    return `$${price.toFixed(6)}`;
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'bg-red-600 text-white';
    if (intensity >= 6) return 'bg-orange-500 text-white';
    if (intensity >= 4) return 'bg-yellow-500 text-black';
    return 'bg-gray-500 text-white';
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    return `${Math.floor(diffInSeconds / 3600)}h`;
  };

  return (
    <div
      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
        type === 'long' 
          ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-25' 
          : 'border-green-500 bg-gradient-to-r from-green-50 to-green-25'
      } ${isReal ? 'ring-2 ring-purple-300' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isReal ? <Zap className="w-4 h-4 text-purple-600" /> : <Activity className="w-4 h-4 text-gray-500" />}
          <span className="font-bold text-gray-900">{ticker.replace('USDT', '')}</span>
          <Badge 
            className={`text-xs ${type === 'long' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
          >
            {type.toUpperCase()} LIQ
          </Badge>
          {isReal && (
            <Badge className="bg-purple-100 text-purple-800 text-xs">
              REAL
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(intensity)}`}>
            LV{intensity}
          </span>
          <span className="text-xs text-gray-500">{getTimeAgo(timestamp)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-600">Valor:</span>
          <span className={`font-bold ml-1 ${type === 'long' ? 'text-red-600' : 'text-green-600'}`}>
            {formatAmount(amount)}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Preço:</span>
          <span className="font-medium text-gray-700 ml-1">{formatPrice(price)}</span>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <Badge 
          variant="outline" 
          className={`text-xs ${source === 'FORCE_ORDER' ? 'border-purple-300 text-purple-700' : 'border-gray-300 text-gray-600'}`}
        >
          {source === 'FORCE_ORDER' ? '🔥 Force Order' : '📊 Price Analysis'}
        </Badge>
        
        {isReal && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-purple-600 font-medium">Live</span>
          </div>
        )}
      </div>
    </div>
  );
};
