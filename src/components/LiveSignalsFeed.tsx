
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Volume2, DollarSign, Clock, Zap, Activity, Filter, Eye } from 'lucide-react';
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
  priority: 'low' | 'medium' | 'high' | 'extreme';
}

export const LiveSignalsFeed: React.FC = () => {
  const { alerts, flowData } = useRealFlowData();
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>([]);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'liquidation' | 'large_order' | 'volume'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'extreme'>('all');

  useEffect(() => {
    // Processar alertas em sinais ao vivo
    alerts.forEach(alert => {
      const strength = alert.alert_level || 1;
      const priority = strength >= 4 ? 'extreme' : strength >= 3 ? 'high' : strength >= 2 ? 'medium' : 'low';
      
      const newSignal: LiveSignal = {
        id: `${alert.ticker}-${alert.timestamp}-${Math.random()}`,
        type: alert.type === 'unusual_volume' ? (alert.details?.direction === 'sell' ? 'sell' : 'buy') : 
              alert.type === 'liquidation' ? 'liquidation' : 
              alert.type === 'large_order' ? 'large_order' : 'volume',
        asset: alert.ticker.replace('USDT', ''),
        price: alert.price,
        value: alert.details?.volume ? parseFloat(alert.details.volume) * alert.price : 0,
        timestamp: new Date(alert.timestamp),
        strength: strength,
        description: alert.details?.direction || alert.type,
        priority: priority as 'low' | 'medium' | 'high' | 'extreme'
      };

      setLiveSignals(prev => {
        const exists = prev.some(signal => signal.id === newSignal.id);
        if (!exists) {
          return [newSignal, ...prev.slice(0, 99)].sort((a, b) => {
            // Sort by priority first, then by timestamp
            const priorityOrder = { extreme: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.timestamp.getTime() - a.timestamp.getTime();
          });
        }
        return prev;
      });
    });

    // Processar dados de flow para sinais de volume
    flowData.forEach(data => {
      if (data.volume > 1000000) { // Volume > 1M
        const strength = data.volume > 10000000 ? 5 : data.volume > 5000000 ? 4 : 3;
        const priority = strength >= 4 ? 'extreme' : strength >= 3 ? 'high' : 'medium';
        
        const volumeSignal: LiveSignal = {
          id: `volume-${data.ticker}-${data.timestamp}`,
          type: 'volume',
          asset: data.ticker.replace('USDT', ''),
          price: data.price,
          value: data.volume * data.price,
          timestamp: new Date(data.timestamp),
          strength: strength,
          description: `High volume: ${(data.volume / 1e6).toFixed(2)}M`,
          priority: priority as 'low' | 'medium' | 'high' | 'extreme'
        };

        setLiveSignals(prev => {
          const exists = prev.some(signal => signal.id === volumeSignal.id);
          if (!exists) {
            return [volumeSignal, ...prev.slice(0, 99)].sort((a, b) => {
              const priorityOrder = { extreme: 4, high: 3, medium: 2, low: 1 };
              const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
              if (priorityDiff !== 0) return priorityDiff;
              return b.timestamp.getTime() - a.timestamp.getTime();
            });
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

  const getSignalColor = (type: string, priority: string) => {
    const baseColors = {
      buy: 'border-green-500 bg-green-50',
      sell: 'border-red-500 bg-red-50',
      liquidation: 'border-red-600 bg-red-100',
      large_order: 'border-purple-500 bg-purple-50',
      volume: 'border-blue-500 bg-blue-50'
    };
    
    if (priority === 'extreme') {
      return baseColors[type as keyof typeof baseColors] + ' ring-2 ring-orange-300 shadow-lg';
    }
    
    return baseColors[type as keyof typeof baseColors] || 'border-gray-500 bg-gray-50';
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      extreme: 'bg-red-600 text-white animate-pulse',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-gray-400 text-white'
    };
    
    return badges[priority as keyof typeof badges] || badges.low;
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

  const filteredSignals = liveSignals.filter(signal => {
    if (filter !== 'all' && signal.type !== filter) return false;
    if (priorityFilter === 'high' && !['high', 'extreme'].includes(signal.priority)) return false;
    if (priorityFilter === 'extreme' && signal.priority !== 'extreme') return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Filter Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Type:</span>
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs px-2 py-1 border border-gray-300 rounded"
          >
            <option value="all">All</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="liquidation">Liquidation</option>
            <option value="large_order">Large Order</option>
            <option value="volume">Volume</option>
          </select>
          
          <span className="text-sm text-gray-600">Priority:</span>
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="text-xs px-2 py-1 border border-gray-300 rounded"
          >
            <option value="all">All</option>
            <option value="high">High+</option>
            <option value="extreme">Extreme</option>
          </select>
          
          <div className="ml-auto text-xs text-gray-500">
            {filteredSignals.length}/{liveSignals.length} signals
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-4 max-h-[400px]">
        {filteredSignals.length > 0 ? (
          filteredSignals.map((signal) => (
            <div
              key={signal.id}
              className={`p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${getSignalColor(signal.type, signal.priority)}`}
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
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${getPriorityBadge(signal.priority)}`}>
                    {signal.priority.toUpperCase()}
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
                  <div className="font-medium text-orange-600">{signal.strength}/5</div>
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
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  {filter === 'all' ? 'Monitoring All Signals' : `Monitoring ${filter.toUpperCase()} Signals`}
                </h4>
                <p className="text-gray-500 text-xs max-w-xs">
                  Waiting for live signals from all alert types...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {liveSignals.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{filteredSignals.length} visible • {liveSignals.length} total signals</span>
            <span className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Real-time</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
