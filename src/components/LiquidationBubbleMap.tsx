import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { useTrading } from '../contexts/TradingContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';

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
  lastUpdateTime: Date;
  totalLiquidated: number;
}

// Top 50 assets considerados high market cap
const highMarketCapAssets = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT',
  'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'NEOUSDT',
  'ALGOUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT', 'APEUSDT', 'CHZUSDT', 'GALAUSDT', 'ENJUSDT', 'NEARUSDT', 'QNTUSDT',
  'FLOWUSDT', 'ICPUSDT', 'THETAUSDT', 'XTZUSDT', 'MKRUSDT', 'FTMUSDT', 'AAVEUSDT', 'SNXUSDT', 'CRVUSDT', 'COMPUSDT',
  'UNIUSDT', 'SUSHIUSDT', 'YFIUSDT', 'ZRXUSDT', 'BATUSDT', 'RENUSDT', 'KNCUSDT', 'LRCUSDT', 'ALPHAUSDT', 'ZENUSDT'
];

export const LiquidationBubbleMap: React.FC = () => {
  const { flowData } = useRealFlowData();
  const { setSelectedAsset } = useTrading();
  const [longLiquidations, setLongLiquidations] = useState<LiquidationBubble[]>([]);
  const [shortLiquidations, setShortLiquidations] = useState<LiquidationBubble[]>([]);
  const [processedTickers, setProcessedTickers] = useState<Set<string>>(new Set());

  // Limpeza automática a cada minuto
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      console.log('🧹 Limpando liquidações antigas...');
      
      setLongLiquidations(prev => {
        const filtered = prev.filter(liq => liq.lastUpdateTime > fifteenMinutesAgo);
        const removed = prev.length - filtered.length;
        if (removed > 0) {
          console.log(`🗑️ Removidas ${removed} liquidações LONG antigas`);
        }
        return filtered;
      });
      
      setShortLiquidations(prev => {
        const filtered = prev.filter(liq => liq.lastUpdateTime > fifteenMinutesAgo);
        const removed = prev.length - filtered.length;
        if (removed > 0) {
          console.log(`🗑️ Removidas ${removed} liquidações SHORT antigas`);
        }
        return filtered;
      });

      // Limpar tickers processados também
      setProcessedTickers(new Set());
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const newLongLiquidations: LiquidationBubble[] = [];
    const newShortLiquidations: LiquidationBubble[] = [];

    // Processar apenas dados únicos e válidos
    const uniqueData = flowData.filter((data, index, self) => {
      const key = `${data.ticker}-${data.timestamp}`;
      return (
        data.ticker && 
        !isNaN(data.price) && 
        data.price > 0 &&
        !isNaN(data.volume) && 
        data.volume > 0 &&
        data.change_24h !== undefined &&
        !processedTickers.has(key) &&
        index === self.findIndex(d => d.ticker === data.ticker) // Pegar apenas o mais recente de cada ticker
      );
    });

    uniqueData.forEach(data => {
      const priceChange = Math.abs(data.change_24h || 0);
      const volumeValue = data.volume * data.price;
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      // Filtros ajustados para detectar liquidações
      const threshold = isHighMarketCap ? 
        { volume: 25000, priceChange: 0.8 } :   // High cap: $25k + 0.8%
        { volume: 8000, priceChange: 1.2 };     // Low cap: $8k + 1.2%
      
      // Detectar liquidação
      if (volumeValue > threshold.volume && priceChange > threshold.priceChange) {
        // Calcular intensidade baseada nos dados
        const volumeRatio = volumeValue / threshold.volume;
        const priceRatio = priceChange / threshold.priceChange;
        const combinedRatio = (volumeRatio + priceRatio) / 2;
        
        let intensity = 1;
        if (combinedRatio >= 10) intensity = 5;
        else if (combinedRatio >= 6) intensity = 4;
        else if (combinedRatio >= 3.5) intensity = 3;
        else if (combinedRatio >= 2) intensity = 2;
        else intensity = 1;
        
        const liquidation: LiquidationBubble = {
          id: `${data.ticker}-${now.getTime()}`,
          asset: data.ticker.replace('USDT', ''),
          type: (data.change_24h || 0) < 0 ? 'long' : 'short',
          amount: volumeValue,
          price: data.price,
          marketCap: isHighMarketCap ? 'high' : 'low',
          timestamp: new Date(data.timestamp || now.getTime()),
          intensity,
          change24h: data.change_24h || 0,
          volume: data.volume,
          lastUpdateTime: now,
          totalLiquidated: volumeValue
        };
        
        console.log(`💥 Nova liquidação detectada: ${liquidation.asset} - ${liquidation.type.toUpperCase()} - ${formatAmount(liquidation.totalLiquidated)}`);
        
        if (liquidation.type === 'long') {
          newLongLiquidations.push(liquidation);
        } else {
          newShortLiquidations.push(liquidation);
        }

        // Marcar como processado
        setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
      }
    });

    // Atualizar liquidações acumulando valores
    if (newLongLiquidations.length > 0) {
      setLongLiquidations(prev => {
        const updated = [...prev];
        
        newLongLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // Acumular valor total
            updated[existingIndex] = { 
              ...newLiq, 
              totalLiquidated: updated[existingIndex].totalLiquidated + newLiq.amount,
              lastUpdateTime: now
            };
          } else {
            updated.push(newLiq);
          }
        });
        
        // Ordenar por maior valor liquidado total
        return updated
          .sort((a, b) => b.totalLiquidated - a.totalLiquidated)
          .slice(0, 50); // Limitar a 50 para performance
      });
    }
    
    if (newShortLiquidations.length > 0) {
      setShortLiquidations(prev => {
        const updated = [...prev];
        
        newShortLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // Acumular valor total
            updated[existingIndex] = { 
              ...newLiq, 
              totalLiquidated: updated[existingIndex].totalLiquidated + newLiq.amount,
              lastUpdateTime: now
            };
          } else {
            updated.push(newLiq);
          }
        });
        
        // Ordenar por maior valor liquidado total
        return updated
          .sort((a, b) => b.totalLiquidated - a.totalLiquidated)
          .slice(0, 50); // Limitar a 50 para performance
      });
    }
  }, [flowData, processedTickers]);

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`📈 Ativo selecionado: ${fullTicker}`);
  };

  const formatAmount = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0.00';
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatChange = (change: number) => {
    if (change === undefined || change === null || isNaN(change)) return '0.00%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
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
      
      <div className="bg-white rounded-b-lg">
        {liquidations.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-20">Asset</TableHead>
                  <TableHead className="w-24">Price</TableHead>
                  <TableHead className="w-20">24h %</TableHead>
                  <TableHead className="w-28">Total Liq</TableHead>
                  <TableHead className="w-20">Cap</TableHead>
                  <TableHead className="w-16">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidations.map((liquidation) => (
                  <TableRow key={liquidation.id} className="hover:bg-gray-50">
                    <TableCell className="font-bold">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${liquidation.type === 'long' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <button
                          onClick={() => handleAssetClick(liquidation.asset)}
                          className={`${textColor} hover:underline cursor-pointer font-bold`}
                        >
                          {liquidation.asset}
                        </button>
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
                    <TableCell className="font-mono text-sm font-bold">
                      {formatAmount(liquidation.totalLiquidated)}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-center">
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
                Ordenado por maior valor total liquidado • Auto-remove após 15min sem atividade
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
                  .reduce((total, liq) => total + liq.totalLiquidated, 0)
              )}
            </div>
            <div className="text-gray-600">Total Liquidated</div>
          </div>
        </div>
      </div>
    </div>
  );
};
