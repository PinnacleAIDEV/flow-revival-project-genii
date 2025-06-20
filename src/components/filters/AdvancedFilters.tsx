
import React, { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { useFilters, FilterOptions } from '../../hooks/useFilters';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ onFiltersChange }) => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    updateFilter(key, value);
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    resetFilters();
    onFiltersChange(filters);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'marketCap' && value !== 'all') return true;
    if (key === 'timeframe' && value !== '5m') return true;
    if (key === 'volumeThreshold' && value !== 3) return true;
    if (key === 'priceChangeMin' && value !== -100) return true;
    if (key === 'priceChangeMax' && value !== 100) return true;
    if (key === 'exchange' && value !== 'all') return true;
    return false;
  }).length;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center space-x-2"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {showFilters && (
        <div className="absolute top-12 right-0 z-50 bg-white border rounded-lg shadow-lg p-4 w-96">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Market Cap Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Market Cap</label>
              <select
                value={filters.marketCap}
                onChange={(e) => handleFilterChange('marketCap', e.target.value as FilterOptions['marketCap'])}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Assets</option>
                <option value="high">Large Cap (BTC, ETH, etc.)</option>
                <option value="low">Small Cap / Altcoins</option>
              </select>
            </div>

            {/* Timeframe Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Timeframe</label>
              <select
                value={filters.timeframe}
                onChange={(e) => handleFilterChange('timeframe', e.target.value as FilterOptions['timeframe'])}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>

            {/* Volume Threshold */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Volume Spike Threshold: {filters.volumeThreshold}x
              </label>
              <input
                type="range"
                min="2"
                max="10"
                step="0.5"
                value={filters.volumeThreshold}
                onChange={(e) => handleFilterChange('volumeThreshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2x</span>
                <span>10x</span>
              </div>
            </div>

            {/* Price Change Range */}
            <div>
              <label className="text-sm font-medium block mb-2">Price Change Range</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={filters.priceChangeMin}
                  onChange={(e) => handleFilterChange('priceChangeMin', parseFloat(e.target.value))}
                  className="w-20 border rounded px-2 py-1 text-sm"
                  placeholder="Min %"
                />
                <span className="text-sm">to</span>
                <input
                  type="number"
                  value={filters.priceChangeMax}
                  onChange={(e) => handleFilterChange('priceChangeMax', parseFloat(e.target.value))}
                  className="w-20 border rounded px-2 py-1 text-sm"
                  placeholder="Max %"
                />
                <span className="text-sm">%</span>
              </div>
            </div>

            {/* Exchange Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Exchange</label>
              <select
                value={filters.exchange}
                onChange={(e) => handleFilterChange('exchange', e.target.value as FilterOptions['exchange'])}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Exchanges</option>
                <option value="binance">Binance</option>
                <option value="coinbase">Coinbase</option>
                <option value="kraken">Kraken</option>
              </select>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
            {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};
