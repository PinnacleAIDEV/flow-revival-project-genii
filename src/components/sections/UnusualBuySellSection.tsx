import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { useRealFlowData } from '../../hooks/useRealFlowData';
import { usePersistedData } from '../../hooks/usePersistedData';

interface UnusualAlert {
  id: string;
  asset: string;
  type: 'unusual_buy' | 'unusual_sell';
  price: number;
  volume: number;
  percentage_increase: number;
  timestamp: Date;
  timeframe: string;
  strength: number;
  priceMovement: number;
}

export const UnusualBuySellSection: React.FC = () => {
  const { flowData } = useRealFlowData();
  
  // Usar dados persistidos
  const { 
    data: persistedAlerts, 
    addData: addAlerts 
  } = usePersistedData<UnusualAlert>({
    key: 'unusual_volume_alerts',
    maxAgeMinutes: 5
  });

  const [alerts, setAlerts] = useState<UnusualAlert[]>([]);
  const [klineHistory, setKlineHistory] = useState<Map<string, Array<{
    volume: number;
    timestamp: number;
    price: number;
    high: number;
    low: number;
    close: number;
    open: number;
  }>>>(new Map());

  // Inicializar com dados persistidos
  useEffect(() => {
    console.log(`📊 Inicializando unusual volume com ${persistedAlerts.length} alertas persistidos`);
    setAlerts(persistedAlerts);
  }, [persistedAlerts]);

  useEffect(() => {
    const newAlerts: UnusualAlert[] = [];

    flowData.forEach(data => {
      const symbol = data.ticker;
      const currentVolume = data.kline_volume || data.volume;
      const timestamp = data.timestamp;
      
      if (data.kline_volume) {
        const history = klineHistory.get(symbol) || [];
        
        const newKline = {
          volume: currentVolume,
          timestamp,
          price: data.price,
          high: data.high,
          low: data.low,
          close: data.close,
          open: data.open
        };
        
        history.push(newKline);
        
        // Manter apenas últimas 60 klines (1 hora)
        while (history.length > 60) {
          history.shift();
        }
        
        setKlineHistory(prev => new Map(prev.set(symbol, history)));
        
        // Detectar volume anormal com melhor lógica BUY/SELL
        if (history.length >= 20) {
          const recentKlines = history.slice(-20);
          const avgVolume = recentKlines.slice(0, -1).reduce((sum, item) => sum + item.volume, 0) / (recentKlines.length - 1);
          const volumeIncrease = (currentVolume / avgVolume) * 100;
          
          if (volumeIncrease >= 350 && avgVolume > 0) {
            // Determinar BUY/SELL baseado em múltiplos fatores
            const currentKline = newKline;
            const priceMovement = ((currentKline.close - currentKline.open) / currentKline.open) * 100;
            const wickAnalysis = {
              upperWick: currentKline.high - Math.max(currentKline.open, currentKline.close),
              lowerWick: Math.min(currentKline.open, currentKline.close) - currentKline.low,
              bodySize: Math.abs(currentKline.close - currentKline.open)
            };
            
            // Lógica melhorada para detectar BUY vs SELL
            let alertType: 'unusual_buy' | 'unusual_sell';
            let strength = 1;
            
            // Indicadores de COMPRA (BUY)
            if (
              priceMovement > 0.5 || // Preço subindo
              currentKline.close > currentKline.open || // Candle verde
              wickAnalysis.lowerWick > wickAnalysis.upperWick || // Mais pressão de compra
              data.change_24h > 2 // Tendência de alta no dia
            ) {
              alertType = 'unusual_buy';
              strength = Math.min(5, Math.floor(volumeIncrease / 100) + (priceMovement > 1 ? 1 : 0));
            } 
            // Indicadores de VENDA (SELL)
            else if (
              priceMovement < -0.5 || // Preço caindo
              currentKline.close < currentKline.open || // Candle vermelho
              wickAnalysis.upperWick > wickAnalysis.lowerWick || // Mais pressão de venda
              data.change_24h < -2 // Tendência de baixa no dia
            ) {
              alertType = 'unusual_sell';
              strength = Math.min(5, Math.floor(volumeIncrease / 100) + (priceMovement < -1 ? 1 : 0));
            } else {
              // Volume alto mas sem direção clara - usar change_24h como fallback
              alertType = data.change_24h >= 0 ? 'unusual_buy' : 'unusual_sell';
              strength = Math.min(3, Math.floor(volumeIncrease / 150));
            }
            
            const newAlert: UnusualAlert = {
              id: `${symbol}-${timestamp}`,
              asset: symbol.replace('USDT', ''),
              type: alertType,
              price: data.price,
              volume: currentVolume,
              percentage_increase: volumeIncrease - 100,
              timestamp: new Date(timestamp),
              timeframe: '1min Kline',
              strength,
              priceMovement
            };
            
            // Verificar se já existe
            const exists = alerts.some(alert => alert.id === newAlert.id) || 
                          persistedAlerts.some(alert => alert.id === newAlert.id);
            
            if (!exists) {
              newAlerts.push(newAlert);
            }
          }
        }
      }
    });

    // Adicionar novos alertas se houver
    if (newAlerts.length > 0) {
      console.log(`🚨 ${newAlerts.length} novos alertas de volume detectados`);
      
      setAlerts(prev => {
        const combined = [...newAlerts, ...prev];
        return combined.slice(0, 50); // Limitar a 50
      });
      
      // Persistir novos alertas
      addAlerts(newAlerts);
    }
  }, [flowData, klineHistory, alerts, persistedAlerts, addAlerts]);

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
            <h3 className="text-lg font-bold text-gray-900">Volume Analysis</h3>
            <p className="text-sm text-gray-500">Real-time buy/sell detection</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            {alerts.filter(a => a.type === 'unusual_buy').length} BUYS
          </div>
          <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            {alerts.filter(a => a.type === 'unusual_sell').length} SELLS
          </div>
          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">1min</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-2">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`relative p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md bg-white ${
                alert.type === 'unusual_buy' 
                  ? 'border-green-500 hover:bg-green-50' 
                  : 'border-red-500 hover:bg-red-50'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    alert.type === 'unusual_buy' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {alert.type === 'unusual_buy' ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-lg">{alert.asset}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        alert.type === 'unusual_buy' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {alert.type === 'unusual_buy' ? 'BUY SIGNAL' : 'SELL SIGNAL'}
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
                  <div className="font-bold text-orange-600">+{alert.percentage_increase.toFixed(0)}%</div>
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
                <h4 className="text-lg font-medium text-gray-700 mb-2">Monitoring Market</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  Analyzing 1-minute klines across 200+ assets for unusual buy/sell activity...
                </p>
                <div className="mt-3 text-xs text-blue-600">
                  Alerts trigger on volume {'>'} 350% of average
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 bg-white rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{alerts.length} active alerts</span>
            <span>Based on 1min kline analysis</span>
          </div>
        </div>
      )}
    </div>
  );
};
