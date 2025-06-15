
import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';

interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number; // 1-5 para determinar tamanho da bolha
}

export const LiquidationBubbleMap: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [longLiquidations, setLongLiquidations] = useState<LiquidationBubble[]>([]);
  const [shortLiquidations, setShortLiquidations] = useState<LiquidationBubble[]>([]);

  // Lista de ativos com market cap alto
  const highMarketCapAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
    'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'LTCUSDT', 'BCHUSDT'
  ];

  useEffect(() => {
    const newLongLiquidations: LiquidationBubble[] = [];
    const newShortLiquidations: LiquidationBubble[] = [];

    flowData.forEach(data => {
      const priceChange = Math.abs(data.change_24h);
      const volumeValue = data.volume * data.price;
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      // Critérios para detectar liquidação
      const threshold = isHighMarketCap ? 
        { volume: 200000, priceChange: 3 } : 
        { volume: 30000, priceChange: 5 };
      
      if (volumeValue > threshold.volume && priceChange > threshold.priceChange) {
        const intensity = Math.min(5, Math.floor((volumeValue / threshold.volume) / 2) + 1);
        
        const liquidation: LiquidationBubble = {
          id: `${data.ticker}-${data.timestamp}`,
          asset: data.ticker.replace('USDT', ''),
          type: data.change_24h < 0 ? 'long' : 'short',
          amount: volumeValue,
          price: data.price,
          marketCap: isHighMarketCap ? 'high' : 'low',
          timestamp: new Date(data.timestamp),
          intensity
        };
        
        if (liquidation.type === 'long') {
          newLongLiquidations.push(liquidation);
        } else {
          newShortLiquidations.push(liquidation);
        }
      }
    });

    // Limitar a 20 liquidações por tipo e ordenar por valor
    setLongLiquidations(
      newLongLiquidations
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20)
    );
    
    setShortLiquidations(
      newShortLiquidations
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20)
    );
  }, [flowData]);

  const formatAmount = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const getBubbleSize = (intensity: number) => {
    const sizes = {
      1: 'w-12 h-12 text-xs',
      2: 'w-16 h-16 text-sm',
      3: 'w-20 h-20 text-sm',
      4: 'w-24 h-24 text-base',
      5: 'w-28 h-28 text-lg'
    };
    return sizes[intensity as keyof typeof sizes] || sizes[1];
  };

  const getBubbleColor = (marketCap: 'high' | 'low', type: 'long' | 'short') => {
    if (type === 'long') {
      return marketCap === 'high' 
        ? 'bg-red-500 hover:bg-red-600' 
        : 'bg-red-400 hover:bg-red-500';
    } else {
      return marketCap === 'high' 
        ? 'bg-green-500 hover:bg-green-600' 
        : 'bg-green-400 hover:bg-green-500';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    return `${Math.floor(diffInSeconds / 3600)}h`;
  };

  const BubbleSection = ({ 
    title, 
    liquidations, 
    icon: Icon, 
    bgColor 
  }: { 
    title: string; 
    liquidations: LiquidationBubble[]; 
    icon: any; 
    bgColor: string;
  }) => (
    <div className="flex-1 min-h-0">
      <div className={`p-3 ${bgColor} rounded-t-lg border-b border-gray-200`}>
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-white" />
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <span className="text-sm text-white/80">({liquidations.length})</span>
        </div>
      </div>
      
      <div className="h-80 overflow-y-auto p-4 bg-gray-50">
        {liquidations.length > 0 ? (
          <div className="flex flex-wrap gap-3 justify-center">
            {liquidations.map((liquidation) => (
              <div
                key={liquidation.id}
                className={`
                  ${getBubbleSize(liquidation.intensity)}
                  ${getBubbleColor(liquidation.marketCap, liquidation.type)}
                  rounded-full flex flex-col items-center justify-center
                  text-white font-bold cursor-pointer
                  transform transition-all duration-200
                  hover:scale-110 shadow-lg hover:shadow-xl
                  relative group
                `}
                title={`${liquidation.asset}: ${formatAmount(liquidation.amount)}`}
              >
                {/* Asset Symbol */}
                <div className="text-center leading-tight">
                  <div className="font-bold">{liquidation.asset}</div>
                  <div className="text-xs opacity-90">{formatAmount(liquidation.amount)}</div>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                              bg-black text-white text-xs rounded px-2 py-1 
                              opacity-0 group-hover:opacity-100 transition-opacity
                              whitespace-nowrap z-10">
                  <div>{liquidation.asset} • {getTimeAgo(liquidation.timestamp)} ago</div>
                  <div>{formatAmount(liquidation.amount)} • {liquidation.marketCap} cap</div>
                  <div>Price: ${liquidation.price.toFixed(6)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-2">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto" />
              <h4 className="text-lg font-medium text-gray-600">No {title}</h4>
              <p className="text-gray-500 text-sm">Aguardando liquidações...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Liquidation Bubble Map</h2>
              <p className="text-sm text-gray-500">
                Real-time liquidation visualization • {longLiquidations.length + shortLiquidations.length} active
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Cap</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span>Low Cap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bubble Map Sections */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <BubbleSection
          title="Long Liquidations"
          liquidations={longLiquidations}
          icon={TrendingDown}
          bgColor="bg-red-600"
        />
        
        <BubbleSection
          title="Short Liquidations"
          liquidations={shortLiquidations}
          icon={TrendingUp}
          bgColor="bg-green-600"
        />
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-center space-x-8 text-sm">
          <div className="text-center">
            <div className="font-bold text-red-600">{longLiquidations.length}</div>
            <div className="text-gray-600">Long Liq</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">{shortLiquidations.length}</div>
            <div className="text-gray-600">Short Liq</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-800">
              {formatAmount(
                [...longLiquidations, ...shortLiquidations]
                  .reduce((total, liq) => total + liq.amount, 0)
              )}
            </div>
            <div className="text-gray-600">Total Volume</div>
          </div>
        </div>
      </div>
    </div>
  );
};
