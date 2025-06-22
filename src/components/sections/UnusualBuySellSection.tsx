
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { useKlineVolumeDetector } from '../../hooks/useKlineVolumeDetector';

export const UnusualBuySellSection: React.FC = () => {
  const { allAlerts } = useKlineVolumeDetector();

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    return `${Math.floor(diffInSeconds / 3600)}h`;
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 4) return 'text-red-600 font-bold';
    if (strength >= 3) return 'text-orange-600 font-semibold';
    if (strength >= 2) return 'text-yellow-600 font-medium';
    return 'text-blue-600';
  };

  const getStrengthText = (strength: number) => {
    if (strength >= 4) return 'EXTREME';
    if (strength >= 3) return 'HIGH';
    if (strength >= 2) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Kline Volume Analysis</h3>
            <p className="text-sm text-gray-500">3-minute candlestick detection</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            {allAlerts.filter(a => a.type.includes('buy') || a.type.includes('long')).length} BUYS/LONGS
          </div>
          <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            {allAlerts.filter(a => a.type.includes('sell') || a.type.includes('short')).length} SELLS/SHORTS
          </div>
          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">3min</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-2">
        {allAlerts.length > 0 ? (
          allAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`relative p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md bg-white ${
                alert.type.includes('buy') || alert.type.includes('long')
                  ? 'border-green-500 hover:bg-green-50' 
                  : 'border-red-500 hover:bg-red-50'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    alert.type.includes('buy') || alert.type.includes('long') ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {alert.type.includes('buy') || alert.type.includes('long') ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-lg">{alert.asset}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        alert.type.includes('buy') || alert.type.includes('long')
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {alert.type.toUpperCase().replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStrengthColor(alert.strength)}`}>
                        {getStrengthText(alert.strength)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(alert.timestamp)}</span>
                  </div>
                  <div className={`text-sm font-medium ${
                    alert.priceMovement >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {alert.priceMovement >= 0 ? '+' : ''}{alert.priceMovement.toFixed(2)}%
                  </div>
                </div>
              </div>
              
              {/* Data Grid */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Price</div>
                  <div className="font-bold text-gray-900">{formatPrice(alert.price)}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Volume</div>
                  <div className="font-medium text-gray-700">{formatVolume(alert.volume)}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Spike</div>
                  <div className="font-bold text-orange-600">{alert.volumeMultiplier.toFixed(1)}x</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-center py-12 bg-white rounded-lg">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Monitoring Klines</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  Analyzing 3-minute candlesticks for unusual volume patterns across spot and futures markets...
                </p>
                <div className="mt-3 text-xs text-blue-600">
                  Alerts trigger on volume {'>'} 3x of daily average
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {allAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 bg-white rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{allAlerts.length} active kline alerts</span>
            <span>Based on 3min candlestick analysis</span>
          </div>
        </div>
      )}
    </div>
  );
};
