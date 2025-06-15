import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { useTrading } from '../contexts/TradingContext';
import { useSupabaseStorage } from '../hooks/useSupabaseStorage';
import { LiquidationHeader } from './liquidation/LiquidationHeader';
import { LiquidationTable } from './liquidation/LiquidationTable';
import { LiquidationStats } from './liquidation/LiquidationStats';

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
  const { saveLiquidation } = useSupabaseStorage();
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
        
        // Salvar no Supabase
        saveLiquidation({
          asset: liquidation.asset,
          ticker: data.ticker,
          type: liquidation.type,
          amount: liquidation.amount,
          price: liquidation.price,
          market_cap: liquidation.marketCap,
          intensity: liquidation.intensity,
          change_24h: liquidation.change24h,
          volume: liquidation.volume,
          total_liquidated: liquidation.totalLiquidated,
          volume_spike: 1
        });
        
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
  }, [flowData, processedTickers, saveLiquidation]);

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

  return (
    <div className="h-full flex flex-col">
      <LiquidationHeader />

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <LiquidationTable
          title="Long Liquidations"
          liquidations={longLiquidations}
          icon={TrendingDown}
          bgColor="bg-red-600"
          textColor="text-red-700"
          onAssetClick={handleAssetClick}
        />
        
        <LiquidationTable
          title="Short Liquidations"
          liquidations={shortLiquidations}
          icon={TrendingUp}
          bgColor="bg-green-600"
          textColor="text-green-700"
          onAssetClick={handleAssetClick}
        />
      </div>

      <LiquidationStats
        longLiquidations={longLiquidations}
        shortLiquidations={shortLiquidations}
      />
    </div>
  );
};
