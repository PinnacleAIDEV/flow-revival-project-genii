
import { useMemo } from 'react';
import { TrendReversal } from '../types/liquidation';
import { detectTrendReversals } from '../utils/unifiedLiquidationUtils';
import { useLongLiquidations } from './useLongLiquidations';
import { useShortLiquidations } from './useShortLiquidations';

export const useSeparatedLiquidations = () => {
  const { longLiquidations, longAssets } = useLongLiquidations();
  const { shortLiquidations, shortAssets } = useShortLiquidations();

  // Detectar trend reversals combinando ambos os maps
  const trendReversals = useMemo(() => {
    const combinedAssets = new Map();
    
    // Adicionar assets LONG
    longAssets.forEach((asset, key) => {
      combinedAssets.set(key, asset);
    });
    
    // Adicionar assets SHORT (pode sobrescrever se mesmo asset)
    shortAssets.forEach((asset, key) => {
      const existing = combinedAssets.get(key);
      if (existing) {
        // Combinar dados se o mesmo asset tem long e short
        const combined = {
          ...existing,
          shortPositions: asset.shortPositions,
          shortLiquidated: asset.shortLiquidated,
          combinedTotal: existing.longLiquidated + asset.shortLiquidated,
          liquidationHistory: [
            ...existing.liquidationHistory,
            ...asset.liquidationHistory
          ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        };
        combinedAssets.set(key, combined);
      } else {
        combinedAssets.set(key, asset);
      }
    });
    
    return detectTrendReversals(combinedAssets);
  }, [longAssets, shortAssets]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      totalLong: longLiquidations.length,
      totalShort: shortLiquidations.length,
      highCapLong: longLiquidations.filter(a => a.marketCap === 'high').length,
      highCapShort: shortLiquidations.filter(a => a.marketCap === 'high').length,
      lowCapLong: longLiquidations.filter(a => a.marketCap === 'low').length,
      lowCapShort: shortLiquidations.filter(a => a.marketCap === 'low').length
    };
  }, [longLiquidations, shortLiquidations]);

  console.log(`📊 SEPARATED LIQUIDATIONS: ${longLiquidations.length} Long / ${shortLiquidations.length} Short`);

  return {
    longLiquidations,
    shortLiquidations,
    trendReversals,
    stats,
    unifiedAssets: new Map() // Manter compatibilidade, mas vazio
  };
};
