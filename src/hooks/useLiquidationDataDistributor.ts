
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

    // ETAPA 1: Processar dados brutos com filtros bem permissivos
    flowData.forEach(data => {
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const priceChange = data.change_24h || 0;
      
      // Filtro INICIAL super permissivo - aceitar quase tudo
      const initialMinVolume = marketCap === 'high' ? 1000 : 500; // Muito baixo para capturar mais dados
      
      if (volumeValue > initialMinVolume && Math.abs(priceChange) > 0.01) { // Apenas 0.01% de mudança
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

    console.log(`🔍 Dados após filtro inicial PERMISSIVO: ${processedData.length} (de ${flowData.length} originais)`);

    // ETAPA 2: Aplicar filtros otimizados (agora bem menos restritivos)
    const filteredData = applyOptimizedFilters(processedData);
    
    console.log(`🔍 Dados após filtros otimizados: ${filteredData.length} (de ${processedData.length})`);
    
    // ETAPA 3: Separar em long/short baseado na mudança de preço
    const longData: LiquidationFlowData[] = [];
    const shortData: LiquidationFlowData[] = [];

    filteredData.forEach(data => {
      // Lógica melhorada para separação long/short
      if (data.change_24h < -0.5) {
        // Preço caindo mais de 0.5% = Long liquidations (apostavam na alta)
        longData.push({ ...data, type: 'long' });
      } else if (data.change_24h > 0.5) {
        // Preço subindo mais de 0.5% = Short liquidations (apostavam na queda)
        shortData.push({ ...data, type: 'short' });
      } else {
        // Para mudanças pequenas, distribuir baseado no volume
        if (data.volumeValue > 10000) {
          longData.push({ ...data, type: 'long' });
        }
      }
    });

    // Calcular estatísticas de processamento
    const stats = getFilterStats(processedData, filteredData);
    setProcessingStats({
      originalCount: processedData.length,
      afterFiltersCount: filteredData.length,
      reductionPercentage: stats.reduction
    });

    console.log(`🔥 SISTEMA CORRIGIDO: ${processedData.length} → ${filteredData.length} (${stats.reduction} redução)`);
    console.log(`🔴 LONG detectados: ${longData.length} liquidations`);
    console.log(`🟢 SHORT detectados: ${shortData.length} liquidations`);
    
    setLongFlowData(longData);
    setShortFlowData(shortData);
  }, [flowData, applyOptimizedFilters, getFilterStats]);

  return {
    longFlowData,
    shortFlowData,
    processingStats
  };
};
