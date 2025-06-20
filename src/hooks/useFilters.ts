
import { useState, useMemo } from 'react';

export interface FilterOptions {
  marketCap: 'all' | 'high' | 'low';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  volumeThreshold: number;
  priceChangeMin: number;
  priceChangeMax: number;
  exchange: 'all' | 'binance' | 'coinbase' | 'kraken';
}

const defaultFilters: FilterOptions = {
  marketCap: 'all',
  timeframe: '5m',
  volumeThreshold: 3,
  priceChangeMin: -100,
  priceChangeMax: 100,
  exchange: 'all'
};

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const applyFilters = <T extends any>(
    data: T[],
    filterFn: (item: T, filters: FilterOptions) => boolean
  ) => {
    return useMemo(() => {
      return data.filter(item => filterFn(item, filters));
    }, [data, filters]);
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    applyFilters
  };
};
