
import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Clock } from 'lucide-react';
import { useRealFlowData } from '../../hooks/useRealFlowData';

interface LiquidationAlert {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
}

export const LiquidationAlertSection: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [liquidations, setLiquidations] = useState<LiquidationAlert[]>([]);

  // Lista de ativos com market cap alto (>500M) - principais criptos
  const highMarketCapAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
    'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'LTCUSDT', 'BCHUSDT'
  ];

  useEffect(() => {
    // Detectar possíveis liquidações baseado em movimentos extremos de preço + volume
    flowData.forEach(data => {
      const priceChange = Math.abs(data.change_24h);
      const volumeValue = data.volume * data.price;
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      // Critérios para detectar liquidação:
      // High market cap: volume > $200k USD + mudança > 3%
      // Low market cap: volume > $30k USD + mudança > 5%
      const threshold = isHighMarketCap ? 
        { volume: 200000, priceChange: 3 } : 
        { volume: 30000, priceChange: 5 };
      
      if (volumeValue > threshold.volume && priceChange > threshold.priceChange) {
        const newLiquidation: LiquidationAlert = {
          id: `${data.ticker}-${data.timestamp}`,
          asset: data.ticker.replace('USDT', ''),
          type: data.change_24h < 0 ? 'long' : 'short',
          amount: volumeValue,
          price: data.price,
          marketCap: isHighMarketCap ? 'high' : 'low',
          timestamp: new Date(data.timestamp)
        };
        
        setLiquidations(prev => {
          // Evitar duplicatas e manter apenas últimas 50 liquidações
          const exists = prev.some(liq => liq.id === newLiquidation.id);
          if (!exists) {
            return [newLiquidation, ...prev.slice(0, 49)];
          }
          return prev;
        });
      }
    });
  }, [flowData]);

  const formatAmount = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
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
    
    if (diffInSeconds < 60) return `${diffInSeconds}s atrás`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Liquidation Alerts</h3>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-700 mb-1 text-sm">Market Cap {'>'}500M</h4>
          <p className="text-xs text-red-600">Liquidações acima de $200k USDT</p>
        </div>
        
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-700 mb-1 text-sm">Market Cap {'<'}500M</h4>
          <p className="text-xs text-orange-600">Liquidações acima de $30k USDT</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px] pr-2">
        {liquidations.length > 0 ? (
          liquidations.map((liquidation) => (
            <div
              key={liquidation.id}
              className="p-4 rounded-lg border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-25 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-gray-900">{liquidation.asset}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    liquidation.marketCap === 'high' 
                      ? 'bg-red-200 text-red-800' 
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {liquidation.type.toUpperCase()} LIQ
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(liquidation.timestamp)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-bold text-red-600">{formatAmount(liquidation.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preço:</span>
                    <span className="font-medium text-gray-700">{formatPrice(liquidation.price)}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="text-red-600 font-medium">{liquidation.type}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cap:</span>
                    <span className={`text-xs font-medium ${
                      liquidation.marketCap === 'high' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {liquidation.marketCap === 'high' ? 'Alto' : 'Baixo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-center py-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Monitoring Liquidations</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  Aguardando sinais de liquidação baseados em market cap...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {liquidations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {liquidations.length} liquidações detectadas
          </div>
        </div>
      )}
    </div>
  );
};
