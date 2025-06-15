
import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number;
  change24h: number;
  volume: number;
}

export const LiquidationBubbleMap: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [longLiquidations, setLongLiquidations] = useState<LiquidationBubble[]>([]);
  const [shortLiquidations, setShortLiquidations] = useState<LiquidationBubble[]>([]);

  // Lista expandida de ativos com market cap alto
  const highMarketCapAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
    'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'LTCUSDT', 'BCHUSDT', 'UNIUSDT',
    'ATOMUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'XLMUSDT', 'VETUSDT', 'ICPUSDT',
    'NEARUSDT', 'ALGOUSDT', 'QNTUSDT', 'FLOWUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT'
  ];

  useEffect(() => {
    const newLongLiquidations: LiquidationBubble[] = [];
    const newShortLiquidations: LiquidationBubble[] = [];

    flowData.forEach(data => {
      const priceChange = Math.abs(data.change_24h);
      const volumeValue = data.volume * data.price;
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      // Critérios MAIS SENSÍVEIS para detectar liquidação
      const threshold = isHighMarketCap ? 
        { volume: 50000, priceChange: 1.5 } :    // Reduzido de 200k/3% para 50k/1.5%
        { volume: 10000, priceChange: 2.5 };     // Reduzido de 30k/5% para 10k/2.5%
      
      if (volumeValue > threshold.volume && priceChange > threshold.priceChange) {
        // Cálculo de intensidade mais generoso
        const volumeRatio = volumeValue / threshold.volume;
        const priceRatio = priceChange / threshold.priceChange;
        const combinedRatio = (volumeRatio + priceRatio) / 2;
        
        let intensity = 1;
        if (combinedRatio >= 10) intensity = 5;
        else if (combinedRatio >= 6) intensity = 4;
        else if (combinedRatio >= 3) intensity = 3;
        else if (combinedRatio >= 1.5) intensity = 2;
        else intensity = 1;
        
        const liquidation: LiquidationBubble = {
          id: `${data.ticker}-${data.timestamp}`,
          asset: data.ticker.replace('USDT', ''),
          type: data.change_24h < 0 ? 'long' : 'short',
          amount: volumeValue,
          price: data.price,
          marketCap: isHighMarketCap ? 'high' : 'low',
          timestamp: new Date(data.timestamp),
          intensity,
          change24h: data.change_24h,
          volume: data.volume
        };
        
        if (liquidation.type === 'long') {
          newLongLiquidations.push(liquidation);
        } else {
          newShortLiquidations.push(liquidation);
        }
      }
    });

    // Aumentar limite para 50 liquidações por tipo e ordenar por valor
    setLongLiquidations(
      newLongLiquidations
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 50)
    );
    
    setShortLiquidations(
      newShortLiquidations
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 50)
    );
  }, [flowData]);

  const formatAmount = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    return `${Math.floor(diffInSeconds / 3600)}h`;
  };

  const getIntensityColor = (intensity: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-700',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-red-200 text-red-900'
    };
    return colors[intensity as keyof typeof colors] || colors[1];
  };

  const LiquidationTable = ({ 
    title, 
    liquidations, 
    icon: Icon, 
    bgColor,
    textColor 
  }: { 
    title: string; 
    liquidations: LiquidationBubble[]; 
    icon: any; 
    bgColor: string;
    textColor: string;
  }) => (
    <div className="flex-1 min-h-0">
      <div className={`p-3 ${bgColor} rounded-t-lg border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <span className="text-sm text-white/80">({liquidations.length})</span>
          </div>
        </div>
      </div>
      
      <div className="h-80 overflow-y-auto bg-white">
        {liquidations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Asset</TableHead>
                <TableHead className="w-24">Price</TableHead>
                <TableHead className="w-20">24h %</TableHead>
                <TableHead className="w-28">Volume</TableHead>
                <TableHead className="w-20">Cap</TableHead>
                <TableHead className="w-16">Risk</TableHead>
                <TableHead className="w-16">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liquidations.map((liquidation) => (
                <TableRow key={liquidation.id} className="hover:bg-gray-50">
                  <TableCell className="font-bold">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${liquidation.type === 'long' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className={textColor}>{liquidation.asset}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatPrice(liquidation.price)}
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${liquidation.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatChange(liquidation.change24h)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatAmount(liquidation.amount)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      liquidation.marketCap === 'high' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {liquidation.marketCap === 'high' ? 'HIGH' : 'LOW'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(liquidation.intensity)}`}>
                      {liquidation.intensity}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {getTimeAgo(liquidation.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              <h2 className="text-xl font-bold text-gray-900">Live Liquidations Monitor</h2>
              <p className="text-sm text-gray-500">
                Real-time liquidation tracking • {longLiquidations.length + shortLiquidations.length} active positions • Enhanced sensitivity
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Long Liquidations</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Short Liquidations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidation Tables */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <LiquidationTable
          title="Long Liquidations"
          liquidations={longLiquidations}
          icon={TrendingDown}
          bgColor="bg-red-600"
          textColor="text-red-700"
        />
        
        <LiquidationTable
          title="Short Liquidations"
          liquidations={shortLiquidations}
          icon={TrendingUp}
          bgColor="bg-green-600"
          textColor="text-green-700"
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
