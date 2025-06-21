
import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Clock, Zap } from 'lucide-react';
import { useRealFlowData } from '../../hooks/useRealFlowData';
import { RealLiquidationAlert } from '../liquidation/RealLiquidationAlert';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface LiquidationAlert {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number;
  isReal: boolean;
  source: 'FORCE_ORDER' | 'PRICE_ANALYSIS';
}

export const LiquidationAlertSection: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [liquidations, setLiquidations] = useState<LiquidationAlert[]>([]);

  const highMarketCapAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
    'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'LTCUSDT', 'BCHUSDT'
  ];

  useEffect(() => {
    flowData.forEach(data => {
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      // PRIORIDADE 1: Force Orders (liquidações REAIS)
      if (data.isLiquidation && data.liquidationType && data.liquidationAmount) {
        const realLiquidation: LiquidationAlert = {
          id: `real-${data.ticker}-${data.timestamp}`,
          asset: data.ticker.replace('USDT', ''),
          type: data.liquidationType === 'LONG' ? 'long' : 'short',
          amount: data.liquidationAmount,
          price: data.price,
          marketCap: isHighMarketCap ? 'high' : 'low',
          timestamp: new Date(data.timestamp),
          intensity: Math.min(10, Math.floor(data.liquidationAmount / 50000)),
          isReal: true,
          source: 'FORCE_ORDER'
        };
        
        setLiquidations(prev => {
          const exists = prev.some(l => l.id === realLiquidation.id);
          if (!exists) {
            console.log(`🔥 REAL LIQUIDATION ALERT: ${realLiquidation.asset} ${realLiquidation.type.toUpperCase()} $${(realLiquidation.amount/1000).toFixed(1)}K`);
            return [realLiquidation, ...prev.slice(0, 49)];
          }
          return prev;
        });
      } else {
        // PRIORIDADE 2: Análise de preço/volume (backup)
        const priceChange = Math.abs(data.change_24h);
        const volumeValue = data.volume * data.price;
        
        const threshold = isHighMarketCap ? 
          { volume: 200000, priceChange: 5 } : 
          { volume: 50000, priceChange: 7 };
        
        if (volumeValue > threshold.volume && priceChange > threshold.priceChange) {
          const analysisLiquidation: LiquidationAlert = {
            id: `analysis-${data.ticker}-${data.timestamp}`,
            asset: data.ticker.replace('USDT', ''),
            type: data.change_24h < 0 ? 'long' : 'short',
            amount: volumeValue,
            price: data.price,
            marketCap: isHighMarketCap ? 'high' : 'low',
            timestamp: new Date(data.timestamp),
            intensity: Math.min(8, Math.floor(priceChange / 2)),
            isReal: false,
            source: 'PRICE_ANALYSIS'
          };
          
          setLiquidations(prev => {
            const exists = prev.some(l => l.id === analysisLiquidation.id);
            if (!exists) {
              return [analysisLiquidation, ...prev.slice(0, 49)];
            }
            return prev;
          });
        }
      }
    });
  }, [flowData]);

  const realLiquidationsCount = liquidations.filter(l => l.isReal).length;
  const analysisLiquidationsCount = liquidations.filter(l => !l.isReal).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">REAL Liquidation Alerts</h3>
          <Badge className="bg-purple-100 text-purple-800">
            {realLiquidationsCount} reais
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-1">
            <Zap className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-purple-700 text-sm">Force Orders</h4>
          </div>
          <p className="text-xs text-purple-600">Liquidações REAIS da Binance</p>
          <div className="text-lg font-bold text-purple-700 mt-1">{realLiquidationsCount}</div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingDown className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-700 text-sm">Análises</h4>
          </div>
          <p className="text-xs text-gray-600">Possíveis liquidações</p>
          <div className="text-lg font-bold text-gray-700 mt-1">{analysisLiquidationsCount}</div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 max-h-[400px] pr-2">
        <div className="space-y-3">
          {liquidations.length > 0 ? (
            liquidations
              .sort((a, b) => {
                // Priorizar liquidações reais
                if (a.isReal && !b.isReal) return -1;
                if (!a.isReal && b.isReal) return 1;
                // Depois por timestamp
                return b.timestamp.getTime() - a.timestamp.getTime();
              })
              .map((liquidation) => (
                <RealLiquidationAlert
                  key={liquidation.id}
                  ticker={liquidation.asset}
                  type={liquidation.type}
                  amount={liquidation.amount}
                  price={liquidation.price}
                  intensity={liquidation.intensity}
                  isReal={liquidation.isReal}
                  source={liquidation.source}
                  timestamp={liquidation.timestamp.getTime()}
                />
              ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Monitoring REAL Liquidations</h4>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Conectado ao Force Order stream da Binance para liquidações em tempo real...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {liquidations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {liquidations.length} alertas • {realLiquidationsCount} liquidações reais confirmadas
          </div>
        </div>
      )}
    </div>
  );
};
