
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';
import { useRealFlowData } from '../../hooks/useRealFlowData';

interface UnusualAlert {
  id: string;
  asset: string;
  type: 'unusual_buy' | 'unusual_sell';
  price: number;
  volume: number;
  percentage_increase: number;
  timestamp: Date;
  timeframe: string;
}

export const UnusualBuySellSection: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [alerts, setAlerts] = useState<UnusualAlert[]>([]);
  const [klineHistory, setKlineHistory] = useState<Map<string, Array<{volume: number, timestamp: number}>>>(new Map());

  useEffect(() => {
    // Processar dados Kline de 1 minuto para detectar unusual buy/sell
    flowData.forEach(data => {
      const symbol = data.ticker;
      const currentVolume = data.kline_volume || data.volume;
      const timestamp = data.timestamp;
      
      // Atualizar histórico de Kline
      const history = klineHistory.get(symbol) || [];
      
      // Adicionar novo ponto apenas se for dados Kline (tem kline_volume)
      if (data.kline_volume) {
        history.push({ volume: currentVolume, timestamp });
        
        // Manter apenas últimas 60 klines (1 hora de dados de 1min)
        while (history.length > 60) {
          history.shift();
        }
        
        setKlineHistory(prev => new Map(prev.set(symbol, history)));
        
        // Detectar volume anormal se temos histórico suficiente (mínimo 20 klines)
        if (history.length >= 20) {
          const recentVolumes = history.slice(-20);
          const avgVolume = recentVolumes.slice(0, -1).reduce((sum, item) => sum + item.volume, 0) / (recentVolumes.length - 1);
          const volumeIncrease = (currentVolume / avgVolume) * 100;
          
          // Alerta se volume atual é 400% ou mais da média (mais restrito para Kline)
          if (volumeIncrease >= 400 && avgVolume > 0) {
            const newAlert: UnusualAlert = {
              id: `${symbol}-${timestamp}`,
              asset: symbol.replace('USDT', ''),
              type: data.change_24h >= 0 ? 'unusual_buy' : 'unusual_sell',
              price: data.price,
              volume: currentVolume,
              percentage_increase: volumeIncrease - 100,
              timestamp: new Date(timestamp),
              timeframe: '1min Kline'
            };
            
            setAlerts(prev => {
              // Evitar duplicatas
              const exists = prev.some(alert => alert.id === newAlert.id);
              if (!exists) {
                return [newAlert, ...prev.slice(0, 49)]; // Manter 50 alertas
              }
              return prev;
            });
          }
        }
      }
    });
  }, [flowData, klineHistory]);

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
    
    if (diffInSeconds < 60) return `${diffInSeconds}s atrás`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Volume Analysis</h3>
        </div>
        <div className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">1min Kline</div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-2">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md ${
                alert.type === 'unusual_buy' 
                  ? 'bg-gradient-to-r from-green-50 to-green-25 border-green-500' 
                  : 'bg-gradient-to-r from-red-50 to-red-25 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {alert.type === 'unusual_buy' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-bold text-gray-900 text-lg">{alert.asset}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    alert.type === 'unusual_buy' 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {alert.type === 'unusual_buy' ? 'BUY ALERT' : 'SELL ALERT'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(alert.timestamp)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preço:</span>
                    <span className="font-bold text-gray-900">{formatPrice(alert.price)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium text-gray-700">{formatVolume(alert.volume)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aumento:</span>
                    <span className="font-bold text-orange-600">+{alert.percentage_increase.toFixed(0)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timeframe:</span>
                    <span className="text-xs text-blue-600 font-medium">{alert.timeframe}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-center py-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Monitoring Volume</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  Analisando Klines de 1 minuto em 200+ ativos para detectar volume anormal...
                </p>
                <div className="mt-3 text-xs text-blue-600">
                  Alertas em volume {'>'} 400% da média
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {alerts.length} alertas • Baseado em análise Kline 1min
          </div>
        </div>
      )}
    </div>
  );
};
