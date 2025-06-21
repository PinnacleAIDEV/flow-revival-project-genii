
import { useState, useMemo } from 'react';
import { LiquidationFlowData } from './useLiquidationDataDistributor';

export interface OptimizedFilters {
  minVolume: number;
  marketCap: 'all' | 'high' | 'low';
  minPriceChange: number;
  onlySignificant: boolean;
  excludeStablecoins: boolean;
}

const DEFAULT_FILTERS: OptimizedFilters = {
  minVolume: 50000, // $50k mínimo (muito mais agressivo)
  marketCap: 'all',
  minPriceChange: 2, // 2% mínimo de mudança
  onlySignificant: true, // Apenas liquidações realmente significativas
  excludeStablecoins: true // Excluir stablecoins por padrão
};

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD'];

export const useOptimizedFilters = () => {
  const [filters, setFilters] = useState<OptimizedFilters>(DEFAULT_FILTERS);

  // Filtro inteligente que reduz drasticamente o volume de dados
  const applyOptimizedFilters = useMemo(() => {
    return (data: LiquidationFlowData[]): LiquidationFlowData[] => {
      return data.filter(item => {
        // 1. Filtro de Volume Mínimo (MUITO mais restritivo)
        const volumeThreshold = filters.marketCap === 'high' ? 
          Math.max(filters.minVolume, 100000) : // High cap: min $100k
          Math.max(filters.minVolume, 25000);   // Low cap: min $25k
        
        if (item.volumeValue < volumeThreshold) return false;

        // 2. Filtro de Market Cap
        if (filters.marketCap !== 'all' && item.marketCap !== filters.marketCap) {
          return false;
        }

        // 3. Filtro de Mudança de Preço
        if (Math.abs(item.change_24h) < filters.minPriceChange) {
          return false;
        }

        // 4. Apenas liquidações significativas
        if (filters.onlySignificant) {
          const isSignificant = item.marketCap === 'high' ? 
            item.volumeValue > 200000 : // High cap: $200k+
            item.volumeValue > 50000;   // Low cap: $50k+
          
          if (!isSignificant) return false;
        }

        // 5. Excluir Stablecoins
        if (filters.excludeStablecoins) {
          const isStablecoin = STABLECOINS.some(stable => 
            item.ticker.includes(stable)
          );
          if (isStablecoin) return false;
        }

        return true;
      });
    };
  }, [filters]);

  const updateFilter = <K extends keyof OptimizedFilters>(
    key: K, 
    value: OptimizedFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Estatísticas dos filtros aplicados
  const getFilterStats = (originalData: LiquidationFlowData[], filteredData: LiquidationFlowData[]) => {
    const reductionPercentage = originalData.length > 0 ? 
      ((originalData.length - filteredData.length) / originalData.length * 100).toFixed(1) : '0';
    
    return {
      original: originalData.length,
      filtered: filteredData.length,
      reduction: `${reductionPercentage}%`,
      totalVolumeFiltered: filteredData.reduce((sum, item) => sum + item.volumeValue, 0)
    };
  };

  return {
    filters,
    applyOptimizedFilters,
    updateFilter,
    resetFilters,
    getFilterStats
  };
};
