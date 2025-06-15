
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useRealFlowData } from '../../hooks/useRealFlowData';

interface UnusualAlert {
  id: string;
  asset: string;
  type: 'unusual_buy' | 'unusual_sell';
  price: number;
  volume: number;
  percentage_increase: number;
  timestamp: Date;
}

export const UnusualBuySellSection: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [alerts, setAlerts] = useState<UnusualAlert[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<Map<string, number[]>>(new Map());

  useEffect(() => {
    // Analisar dados para detectar unusual buy/sell baseado em volume
    flowData.forEach(data => {
      const symbol = data.ticker;
      const currentVolume = data.volume;
      
      // Atualizar histórico de volume
      const history = volumeHistory.get(symbol) || [];
      history.push(currentVolume);
      
      // Manter apenas últimos 20 períodos (3min cada = 1 hora)
      if (history.length > 20) {
        history.shift();
      }
      
      setVolumeHistory(prev => new Map(prev.set(symbol, history)));
      
      // Detectar volume anormal se temos histórico suficiente
      if (history.length >= 10) {
        const avgVolume = history.slice(0, -1).reduce((sum, vol) => sum + vol, 0) / (history.length - 1);
        const volumeIncrease = (currentVolume / avgVolume) * 100;
        
        // Alerta se volume atual é 300% ou mais da média
        if (volumeIncrease >= 300) {
          const newAlert: UnusualAlert = {
            id: `${symbol}-${Date.now()}`,
            asset: symbol.replace('USDT', ''),
            type: data.change_24h > 0 ? 'unusual_buy' : 'unusual_sell',
            price: data.price,
            volume: currentVolume,
            percentage_increase: volumeIncrease - 100,
            timestamp: new Date()
          };
          
          setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Manter 50 alertas
        }
      }
    });
  }, [flowData, volumeHistory]);

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

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Unusual Buy/Sell</h3>
        <div className="text-sm text-gray-500">3min Timeframe</div>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'unusual_buy' 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {alert.type === 'unusual_buy' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-bold text-gray-900">{alert.asset}</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{alert.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className={`font-medium ${
                    alert.type === 'unusual_buy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {alert.type === 'unusual_buy' ? 'UNUSUAL BUY' : 'UNUSUAL SELL'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Preço:</span>
                  <span className="font-bold text-gray-900">{formatPrice(alert.price)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume:</span>
                  <span className="font-medium text-gray-700">{formatVolume(alert.volume)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Aumento:</span>
                  <span className="font-bold text-orange-600">+{alert.percentage_increase.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>Aguardando alertas de volume anormal...</p>
            <p className="text-xs mt-2">Baseado em análise de 3min Klines</p>
          </div>
        )}
      </div>
    </div>
  );
};
