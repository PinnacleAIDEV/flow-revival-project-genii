
import { useLongLiquidations } from './useLongLiquidations';
import { useShortLiquidations } from './useShortLiquidations';
import { useMemo } from 'react';

export const useSeparatedLiquidations = () => {
  const { longLiquidations } = useLongLiquidations();
  const { shortLiquidations } = useShortLiquidations();

  // Logs detalhados para debug - DADOS REALMENTE SEPARADOS
  console.log(`🔴 Long liquidations SEPARADOS: ${longLiquidations.length}`);
  longLiquidations.forEach((asset, index) => {
    if (index < 3) {
      console.log(`🔴 LONG EXCLUSIVO ${asset.asset}: longLiquidated=$${(asset.longLiquidated/1000).toFixed(0)}K, longPositions=${asset.longPositions}`);
    }
  });

  console.log(`🟢 Short liquidations SEPARADOS: ${shortLiquidations.length}`);
  shortLiquidations.forEach((asset, index) => {
    if (index < 3) {
      console.log(`🟢 SHORT EXCLUSIVO ${asset.asset}: shortLiquidated=$${(asset.shortLiquidated/1000).toFixed(0)}K, shortPositions=${asset.shortPositions}`);
    }
  });

  // Verificar se NÃO há sobreposição (deve ser zero agora)
  const longAssetNames = new Set(longLiquidations.map(a => a.asset));
  const shortAssetNames = new Set(shortLiquidations.map(a => a.asset));
  const overlap = [...longAssetNames].filter(name => shortAssetNames.has(name));
  
  if (overlap.length > 0) {
    console.error(`❌ AINDA HÁ OVERLAP: ${overlap.length} assets duplicados:`, overlap);
  } else {
    console.log(`✅ PERFEITO: Nenhum overlap entre long e short liquidations`);
  }

  // Memoizar dados completamente separados
  const memoizedData = useMemo(() => ({
    longLiquidations,
    shortLiquidations,
    totalAssets: longLiquidations.length + shortLiquidations.length,
    hasOverlap: overlap.length > 0,
    overlapCount: overlap.length
  }), [longLiquidations, shortLiquidations, overlap.length]);

  return memoizedData;
};
