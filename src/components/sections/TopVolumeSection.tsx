
import React from 'react';
import { Volume2, TrendingUp, TrendingDown } from 'lucide-react';
import { useRealFlowData } from '../../hooks/useRealFlowData';

export const TopVolumeSection: React.FC = () => {
  const { flowData } = useRealFlowData();

  // Ordenar por volume 24h e pegar top 40
  const topVolumeAssets = flowData
    .filter(data => data.volume_24h > 0)
    .sort((a, b) => b.volume_24h - a.volume_24h)
    .slice(0, 40);

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(6)}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Top 40 Volume</h3>
        </div>
        <div className="text-sm text-gray-500 bg-green-50 px-2 py-1 rounded">24h Futures</div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-2">
        {topVolumeAssets.length > 0 ? (
          topVolumeAssets.map((asset, index) => (
            <div
              key={asset.ticker}
              className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="font-bold text-gray-900">{asset.ticker.replace('USDT', '')}</span>
                  <div className="flex items-center space-x-1">
                    {asset.change_24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${
                      asset.change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.change_24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">{formatPrice(asset.price)}</span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-600">
                <span>Volume 24h: <span className="font-medium">{formatVolume(asset.volume_24h)}</span></span>
                <span>Trades: <span className="font-medium">{asset.trades_count.toLocaleString()}</span></span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-center py-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Volume2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Loading Volume Data</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  Carregando dados de volume dos 200 ativos monitorados...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {topVolumeAssets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {topVolumeAssets.length} ativos • Volume 24h ordenado
          </div>
        </div>
      )}
    </div>
  );
};
