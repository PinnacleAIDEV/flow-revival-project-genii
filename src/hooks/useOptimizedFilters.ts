
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
  minVolume: 10000, // Reduzido de 50000 para 10000 - muito menos restritivo
  marketCap: 'all',
  minPriceChange: 0.5, // Reduzido de 2% para 0.5% - muito menos restritivo
  onlySignificant: false, // Mudado para false - aceitar mais liquidações
  excludeStablecoins: true
};

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD'];

export const useOptimizedFilters = () => {
  const [filters, setFilters] = useState<OptimizedFilters>(DEFAULT_FILTERS);

  // Filtro MUITO MENOS restritivo para permitir mais dados
  const applyOptimizedFilters = useMemo(() => {
    return (data: LiquidationFlowData[]): LiquidationFlowData[] => {
      return data.filter(item => {
        // 1. Filtro de Volume Mínimo (MUITO mais permissivo)
        const volumeThreshold = filters.marketCap === 'high' ? 
          Math.max(filters.minVolume, 15000) : // High cap: min $15k (era $100k)
          Math.max(filters.minVolume, 5000);   // Low cap: min $5k (era $25k)
        
        if (item.volumeValue < volumeThreshold) return false;

        // 2. Filtro de Market Cap
        if (filters.marketCap !== 'all' && item.marketCap !== filters.marketCap) {
          return false;
        }

        // 3. Filtro de Mudança de Preço (MUITO mais permissivo)
        if (Math.abs(item.change_24h) < filters.minPriceChange) {
          return false;
        }

        // 4. Apenas liquidações significativas (MUITO mais permissivo)
        if (filters.onlySignificant) {
          const isSignificant = item.marketCap === 'high' ? 
            item.volumeValue > 25000 : // High cap: $25k+ (era $200k)
            item.volumeValue > 8000;   // Low cap: $8k+ (era $50k)
          
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
