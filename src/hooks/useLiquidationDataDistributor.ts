
import { useState, useEffect } from 'react';
import { useRealFlowData } from './useRealFlowData';
import { useOptimizedFilters } from './useOptimizedFilters';
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
}

export const useLiquidationDataDistributor = () => {
  const { flowData } = useRealFlowData();
  const { applyOptimizedFilters, getFilterStats } = useOptimizedFilters();
  const [longFlowData, setLongFlowData] = useState<LiquidationFlowData[]>([]);
  const [shortFlowData, setShortFlowData] = useState<LiquidationFlowData[]>([]);
  const [processingStats, setProcessingStats] = useState({
    originalCount: 0,
    afterFiltersCount: 0,
    reductionPercentage: '0%'
  });

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const processedData: LiquidationFlowData[] = [];

    // ETAPA 1: Processar dados brutos com filtros básicos
    flowData.forEach(data => {
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const priceChange = data.change_24h || 0;
      
      // Filtro INICIAL mais agressivo (antes mesmo dos filtros principais)
      const initialMinVolume = marketCap === 'high' ? 75000 : 20000;
      
      if (volumeValue > initialMinVolume && Math.abs(priceChange) > 1) {
        processedData.push({
          ticker: data.ticker,
          price: data.price,
          volume: data.volume,
          change_24h: priceChange,
          timestamp: data.timestamp,
          marketCap,
          volumeValue,
          type: 'long' // Temporário, será definido abaixo
        });
      }
    });

    // ETAPA 2: Aplicar filtros otimizados (reduz drasticamente os dados)
    const filteredData = applyOptimizedFilters(processedData);
    
    // ETAPA 3: Separar em long/short com dados já filtrados
    const longData: LiquidationFlowData[] = [];
    const shortData: LiquidationFlowData[] = [];

    filteredData.forEach(data => {
      // Usar hash para separação consistente
      const assetHash = data.ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      
      if (assetHash % 2 === 0) {
        longData.push({ ...data, type: 'long' });
      } else {
        shortData.push({ ...data, type: 'short' });
      }
    });

    // Calcular estatísticas de processamento
    const stats = getFilterStats(processedData, filteredData);
    setProcessingStats({
      originalCount: processedData.length,
      afterFiltersCount: filteredData.length,
      reductionPercentage: stats.reduction
    });

    console.log(`🔥 OTIMIZAÇÃO: ${processedData.length} → ${filteredData.length} (${stats.reduction} redução)`);
    console.log(`🔴 LONG otimizado: ${longData.length} liquidations`);
    console.log(`🟢 SHORT otimizado: ${shortData.length} liquidations`);
    
    setLongFlowData(longData);
    setShortFlowData(shortData);
  }, [flowData, applyOptimizedFilters, getFilterStats]);

  return {
    longFlowData,
    shortFlowData,
    processingStats
  };
};
