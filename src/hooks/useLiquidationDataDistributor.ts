
import { useState, useEffect } from 'react';
import { useRealFlowData } from './useRealFlowData';
import { getMarketCapCategory } from '../types/liquidation';

export interface LiquidationFlowData {
  ticker: string;
  price: number;
  volume: number;
  change_24h: number;
  timestamp: number;
  marketCap: 'high' | 'low';
  volumeValue: number;
  type: 'long' | 'short';
  isRealLiquidation: boolean;
  liquidationAmount?: number;
  liquidationIntensity: number;
  source: 'FORCE_ORDER' | 'PRICE_ANALYSIS';
  // NOVO: Categoria de filtro
  filterCategory: 'COINTREND_HUNTER' | 'LIQUIDATION_BUBBLE' | 'FILTERED_OUT';
}

export const useLiquidationDataDistributor = () => {
  const { flowData } = useRealFlowData();
  const [longFlowData, setLongFlowData] = useState<LiquidationFlowData[]>([]);
  const [shortFlowData, setShortFlowData] = useState<LiquidationFlowData[]>([]);

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const longData: LiquidationFlowData[] = [];
    const shortData: LiquidationFlowData[] = [];

    console.log(`🔍 Processando ${flowData.length} dados com NOVOS FILTROS...`);

    flowData.forEach(data => {
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const priceChange = data.change_24h || 0;
      
      // NOVOS THRESHOLDS DE FILTRO
      let filterCategory: 'COINTREND_HUNTER' | 'LIQUIDATION_BUBBLE' | 'FILTERED_OUT' = 'FILTERED_OUT';
      
      if (data.isLiquidation && data.liquidationType && data.liquidationAmount) {
        // REAL LIQUIDATION via Force Order
        const amount = data.liquidationAmount;
        
        // COINTREND HUNTER: $2K - $15K
        if (amount >= 2000 && amount <= 15000) {
          filterCategory = 'COINTREND_HUNTER';
        }
        // LIQUIDATION BUBBLE: $20K+ low cap, $50K+ high cap
        else if ((marketCap === 'low' && amount >= 20000) || (marketCap === 'high' && amount >= 50000)) {
          filterCategory = 'LIQUIDATION_BUBBLE';
        }
        
        if (filterCategory !== 'FILTERED_OUT') {
          const realLiquidation: LiquidationFlowData = {
            ticker: data.ticker,
            price: data.price,
            volume: data.volume,
            change_24h: priceChange,
            timestamp: data.timestamp,
            marketCap,
            volumeValue: amount,
            type: data.liquidationType === 'LONG' ? 'long' : 'short',
            isRealLiquidation: true,
            liquidationAmount: amount,
            liquidationIntensity: Math.min(10, Math.floor(amount / 25000)),
            source: 'FORCE_ORDER',
            filterCategory
          };

          if (data.liquidationType === 'LONG') {
            longData.push(realLiquidation);
            console.log(`🔴 ${filterCategory}: ${data.ticker} LONG - $${(amount/1000).toFixed(1)}K`);
          } else {
            shortData.push(realLiquidation);
            console.log(`🟢 ${filterCategory}: ${data.ticker} SHORT - $${(amount/1000).toFixed(1)}K`);
          }
        }
      } else {
        // ANÁLISE SECUNDÁRIA para dados sem Force Order
        const minVolume = marketCap === 'high' ? 50000 : 20000; // Usar thresholds do Liquidation Bubble
        
        if (volumeValue > minVolume) {
          let liquidationType: 'long' | 'short' | null = null;
          let intensity = 1;
          
          if (priceChange <= -5 && volumeValue > minVolume * 1.5) {
            liquidationType = 'long';
            intensity = Math.min(8, Math.floor(Math.abs(priceChange))); 
          } else if (priceChange >= 5 && volumeValue > minVolume * 1.5) {
            liquidationType = 'short';
            intensity = Math.min(8, Math.floor(priceChange));
          }
          
          if (liquidationType) {
            const analysisLiquidation: LiquidationFlowData = {
              ticker: data.ticker,
              price: data.price,
              volume: data.volume,
              change_24h: priceChange,
              timestamp: data.timestamp,
              marketCap,
              volumeValue,
              type: liquidationType,
              isRealLiquidation: false,
              liquidationIntensity: intensity,
              source: 'PRICE_ANALYSIS',
              filterCategory: 'LIQUIDATION_BUBBLE' // Análise vai para bubble map apenas
            };
            
            if (liquidationType === 'long') {
              longData.push(analysisLiquidation);
              console.log(`🔸 BUBBLE ANALYSIS LONG: ${data.ticker} - ${priceChange.toFixed(1)}%`);
            } else {
              shortData.push(analysisLiquidation);
              console.log(`🔹 BUBBLE ANALYSIS SHORT: ${data.ticker} - ${priceChange.toFixed(1)}%`);
            }
          }
        }
      }
    });

    // Ordenar por relevância: Force Orders primeiro, depois por valor
    const sortByRelevance = (a: LiquidationFlowData, b: LiquidationFlowData) => {
      if (a.isRealLiquidation && !b.isRealLiquidation) return -1;
      if (!a.isRealLiquidation && b.isRealLiquidation) return 1;
      return b.volumeValue - a.volumeValue;
    };

    longData.sort(sortByRelevance);
    shortData.sort(sortByRelevance);

    console.log(`🔴 LONG FILTRADO: ${longData.length} (${longData.filter(l => l.filterCategory === 'COINTREND_HUNTER').length} CoinTrend, ${longData.filter(l => l.filterCategory === 'LIQUIDATION_BUBBLE').length} Bubble)`);
    console.log(`🟢 SHORT FILTRADO: ${shortData.length} (${shortData.filter(l => l.filterCategory === 'COINTREND_HUNTER').length} CoinTrend, ${shortData.filter(l => l.filterCategory === 'LIQUIDATION_BUBBLE').length} Bubble)`);
    
    setLongFlowData(longData.slice(0, 50));
    setShortFlowData(shortData.slice(0, 50));
  }, [flowData]);

  return {
    longFlowData,
    shortFlowData,
    coinTrendHunterCount: {
      long: longFlowData.filter(l => l.filterCategory === 'COINTREND_HUNTER').length,
      short: shortFlowData.filter(l => l.filterCategory === 'COINTREND_HUNTER').length
    },
    liquidationBubbleCount: {
      long: longFlowData.filter(l => l.filterCategory === 'LIQUIDATION_BUBBLE').length,
      short: shortFlowData.filter(l => l.filterCategory === 'LIQUIDATION_BUBBLE').length
    }
  };
};
