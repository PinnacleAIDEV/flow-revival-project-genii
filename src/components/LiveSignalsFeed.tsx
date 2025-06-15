
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Volume2, DollarSign, Clock, Zap, Activity } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';

interface LiveSignal {
  id: string;
  type: 'buy' | 'sell' | 'liquidation' | 'large_order' | 'volume';
  asset: string;
  price: number;
  value: number;
  timestamp: Date;
  strength: number;
  description: string;
}

export const LiveSignalsFeed: React.FC = () => {
  const { alerts, flowData } = useRealFlowData();
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>([]);

  useEffect(() => {
    // Processar alertas em sinais ao vivo
    alerts.forEach(alert => {
      const newSignal: LiveSignal = {
        id: `${alert.ticker}-${alert.timestamp}-${Math.random()}`,
        type: alert.type === 'unusual_volume' ? 'buy' : 
              alert.type === 'liquidation' ? 'liquidation' : 
              alert.type === 'large_order' ? 'large_order' : 'volume',
        asset: alert.ticker,
        price: alert.price,
        value: alert.details?.volume ? parseFloat(alert.details.volume) * alert.price : 0,
        timestamp: new Date(alert.timestamp),
        strength: alert.alert_level,
        description: alert.details?.direction || alert.type
      };

      setLiveSignals(prev => {
        const exists = prev.some(signal => signal.id === newSignal.id);
        if (!exists) {
          return [newSignal, ...prev.slice(0, 49)];
        }
        return prev;
      });
    });

    // Processar dados de flow para sinais de volume
    flowData.forEach(data => {
      if (data.volume > 1000000) { // Volume > 1M
        const volumeSignal: LiveSignal = {
          id: `volume-${data.ticker}-${data.timestamp}`,
          type: 'volume',
          asset: data.ticker.replace('USDT', ''),
          price: data.price,
          value: data.volume * data.price,
          timestamp: new Date(data.timestamp),
          strength: data.volume > 10000000 ? 5 : 3,
          description: `High volume detected: ${(data.volume / 1e6).toFixed(2)}M`
        };

        setLiveSignals(prev => {
          const exists = prev.some(signal => signal.id === volumeSignal.id);
          if (!exists) {
            return [volumeSignal, ...prev.slice(0, 49)];
          }
          return prev;
        });
      }
    });
  }, [alerts, flowData]);

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'buy': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'sell': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'liquidation': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'large_order': return <DollarSign className="w-4 h-4 text-purple-600" />;
      case 'volume': return <Volume2 className="w-4 h-4 text-blue-600" />;
      default: return <Zap className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'buy': return 'border-green-500 bg-green-50';
      case 'sell': return 'border-red-500 bg-red-50';
      case 'liquidation': return 'border-red-600 bg-red-100';
      case 'large_order': return 'border-purple-500 bg-purple-50';
      case 'volume': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    return `${Math.floor(diffInSeconds / 3600)}h`;
  };

  const getStrengthText = (strength: number) => {
    if (strength >= 4) return 'EXTREME';
    if (strength >= 3) return 'HIGH';
    if (strength >= 2) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2 p-4 max-h-[400px]">
        {liveSignals.length > 0 ? (
          liveSignals.map((signal) => (
            <div
              key={signal.id}
              className={`p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${getSignalColor(signal.type)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getSignalIcon(signal.type)}
                  <span className="font-bold text-gray-900">{signal.asset}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    signal.type === 'buy' ? 'bg-green-200 text-green-800' :
                    signal.type === 'sell' ? 'bg-red-200 text-red-800' :
                    signal.type === 'liquidation' ? 'bg-red-300 text-red-900' :
                    signal.type === 'large_order' ? 'bg-purple-200 text-purple-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {signal.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(signal.timestamp)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Price:</span>
                  <div className="font-medium">{formatPrice(signal.price)}</div>
                </div>
                
                <div>
                  <span className="text-gray-500">Value:</span>
                  <div className="font-medium">{formatValue(signal.value)}</div>
                </div>
                
                <div>
                  <span className="text-gray-500">Strength:</span>
                  <div className="font-medium text-orange-600">{getStrengthText(signal.strength)}</div>
                </div>
              </div>
              
              {signal.description && (
                <div className="mt-2 text-xs text-gray-600 truncate">
                  {signal.description}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-center py-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Monitoring Signals</h4>
                <p className="text-gray-500 text-xs max-w-xs">
                  Aguardando sinais ao vivo de todos os tipos de alertas...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {liveSignals.length > 0 && (
        <div className="p-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {liveSignals.length} sinais ativos • Tempo real
          </div>
        </div>
      )}
    </div>
  );
};
