
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
  minVolume: 2000, // Reduzido drasticamente de 10000 para 2000
  marketCap: 'all',
  minPriceChange: 0.1, // Reduzido de 0.5% para 0.1% - super permissivo
  onlySignificant: false, // Desabilitado para aceitar mais dados
  excludeStablecoins: true
};

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD'];

export const useOptimizedFilters = () => {
  const [filters, setFilters] = useState<OptimizedFilters>(DEFAULT_FILTERS);

  // Filtros SUPER permissivos para recuperar dados
  const applyOptimizedFilters = useMemo(() => {
    return (data: LiquidationFlowData[]): LiquidationFlowData[] => {
      return data.filter(item => {
        // 1. Filtro de Volume Mínimo (MUITO permissivo)
        const volumeThreshold = filters.marketCap === 'high' ? 
          Math.max(filters.minVolume, 3000) : // High cap: min $3k (era $15k)
          Math.max(filters.minVolume, 1000);  // Low cap: min $1k (era $5k)
        
        if (item.volumeValue < volumeThreshold) return false;

        // 2. Filtro de Market Cap
        if (filters.marketCap !== 'all' && item.marketCap !== filters.marketCap) {
          return false;
        }

        // 3. Filtro de Mudança de Preço (SUPER permissivo)
        if (Math.abs(item.change_24h) < filters.minPriceChange) {
          return false;
        }

        // 4. Apenas liquidações significativas (MUITO permissivo)
        if (filters.onlySignificant) {
          const isSignificant = item.marketCap === 'high' ? 
            item.volumeValue > 5000 : // High cap: $5k+ (era $25k)
            item.volumeValue > 2000;  // Low cap: $2k+ (era $8k)
          
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
