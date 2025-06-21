
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

    // ETAPA 1: Processar dados brutos com filtros MUITO MENOS restritivos
    flowData.forEach(data => {
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const priceChange = data.change_24h || 0;
      
      // Filtro INICIAL muito menos agressivo
      const initialMinVolume = marketCap === 'high' ? 5000 : 2000; // Era 75k/20k, agora 5k/2k
      
      if (volumeValue > initialMinVolume && Math.abs(priceChange) > 0.1) { // Era 1%, agora 0.1%
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

    console.log(`🔍 Dados após filtro inicial: ${processedData.length} (de ${flowData.length} originais)`);

    // ETAPA 2: Aplicar filtros otimizados (agora menos restritivos)
    const filteredData = applyOptimizedFilters(processedData);
    
    console.log(`🔍 Dados após filtros otimizados: ${filteredData.length} (de ${processedData.length})`);
    
    // ETAPA 3: Separar em long/short com dados já filtrados
    const longData: LiquidationFlowData[] = [];
    const shortData: LiquidationFlowData[] = [];

    filteredData.forEach(data => {
      // Usar mudança de preço para determinar tipo de liquidação
      if (data.change_24h < 0) {
        // Preço caindo = Long liquidations (apostavam na alta)
        longData.push({ ...data, type: 'long' });
      } else {
        // Preço subindo = Short liquidations (apostavam na queda)
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

    console.log(`🔥 OTIMIZAÇÃO CORRIGIDA: ${processedData.length} → ${filteredData.length} (${stats.reduction} redução)`);
    console.log(`🔴 LONG detectado: ${longData.length} liquidations`);
    console.log(`🟢 SHORT detectado: ${shortData.length} liquidations`);
    
    setLongFlowData(longData);
    setShortFlowData(shortData);
  }, [flowData, applyOptimizedFilters, getFilterStats]);

  return {
    longFlowData,
    shortFlowData,
    processingStats
  };
};
