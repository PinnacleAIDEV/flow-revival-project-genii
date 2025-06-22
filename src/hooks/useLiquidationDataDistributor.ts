
import { useState, useEffect } from 'react';
import { useRealFlowData } from './useRealFlowData';
import { marketCapService } from '../services/MarketCapService';

export interface LiquidationFlowData {
  ticker: string;
  price: number;
  volume: number;
  change_24h: number;
  timestamp: number;
  marketCap: 'high' | 'mid' | 'low';
  volumeValue: number;
  type: 'long' | 'short';
  isRealLiquidation: boolean;
  liquidationAmount?: number;
  liquidationIntensity: number;
  source: 'FORCE_ORDER';
  // NOVO: Categoria de filtro baseada em market cap real
  filterCategory: 'COINTREND_HUNTER' | 'LIQUIDATION_BUBBLE' | 'FILTERED_OUT';
}

export const useLiquidationDataDistributor = () => {
  const { flowData } = useRealFlowData();
  const [longFlowData, setLongFlowData] = useState<LiquidationFlowData[]>([]);
  const [shortFlowData, setShortFlowData] = useState<LiquidationFlowData[]>([]);

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const processData = async () => {
      const longData: LiquidationFlowData[] = [];
      const shortData: LiquidationFlowData[] = [];

      console.log(`🔍 Processando ${flowData.length} dados com NOVOS FILTROS DE MARKET CAP...`);

      for (const data of flowData) {
        // APENAS dados REAIS de Force Order
        if (!data.isLiquidation || !data.liquidationType || !data.liquidationAmount) {
          continue;
        }

        // Obter market cap real
        const marketCap = await marketCapService.getMarketCapCategory(data.ticker);
        const amount = data.liquidationAmount;
        
        // NOVOS FILTROS BASEADOS EM MARKET CAP REAL
        let filterCategory: 'COINTREND_HUNTER' | 'LIQUIDATION_BUBBLE' | 'FILTERED_OUT' = 'FILTERED_OUT';
        
        if (marketCap === 'low' && amount >= 2000 && amount <= 5000) {
          // LOW CAP: $2K-$5K → CoinTrend Hunter
          filterCategory = 'COINTREND_HUNTER';
        } else if (marketCap === 'mid' && amount >= 5000 && amount <= 10000) {
          // MID CAP: $5K-$10K → Liquidation Bubble Map
          filterCategory = 'LIQUIDATION_BUBBLE';
        } else if (marketCap === 'high' && amount >= 10000) {
          // HIGH CAP: $10K+ → Liquidation Bubble Map
          filterCategory = 'LIQUIDATION_BUBBLE';
        }
        
        if (filterCategory !== 'FILTERED_OUT') {
          const liquidationData: LiquidationFlowData = {
            ticker: data.ticker,
            price: data.price,
            volume: data.volume,
            change_24h: data.change_24h || 0,
            timestamp: data.timestamp,
            marketCap,
            volumeValue: amount,
            type: data.liquidationType === 'LONG' ? 'long' : 'short',
            isRealLiquidation: true,
            liquidationAmount: amount,
            liquidationIntensity: Math.min(10, Math.floor(amount / 5000)), // Simplificado
            source: 'FORCE_ORDER',
            filterCategory
          };

          if (data.liquidationType === 'LONG') {
            longData.push(liquidationData);
            console.log(`🔴 ${filterCategory}: ${data.ticker} LONG - $${(amount/1000).toFixed(1)}K (${marketCap})`);
          } else {
            shortData.push(liquidationData);
            console.log(`🟢 ${filterCategory}: ${data.ticker} SHORT - $${(amount/1000).toFixed(1)}K (${marketCap})`);
          }
        }
      }

      // Ordenar por valor de liquidação
      longData.sort((a, b) => b.volumeValue - a.volumeValue);
      shortData.sort((a, b) => b.volumeValue - a.volumeValue);

      console.log(`🔴 LONG FILTRADO: ${longData.length} (${longData.filter(l => l.filterCategory === 'COINTREND_HUNTER').length} CoinTrend, ${longData.filter(l => l.filterCategory === 'LIQUIDATION_BUBBLE').length} Bubble)`);
      console.log(`🟢 SHORT FILTRADO: ${shortData.length} (${shortData.filter(l => l.filterCategory === 'COINTREND_HUNTER').length} CoinTrend, ${shortData.filter(l => l.filterCategory === 'LIQUIDATION_BUBBLE').length} Bubble)`);
      
      setLongFlowData(longData.slice(0, 30)); // Reduzir para economizar dados
      setShortFlowData(shortData.slice(0, 30));
    };

    processData();
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
