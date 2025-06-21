
import { useRealLongLiquidations } from './useRealLongLiquidations';
import { useRealShortLiquidations } from './useRealShortLiquidations';
import { useMemo } from 'react';

export const useRealSeparatedLiquidations = () => {
  const { longLiquidations } = useRealLongLiquidations();
  const { shortLiquidations } = useRealShortLiquidations();

  console.log(`🔴 REAL Long liquidations: ${longLiquidations.length}`);
  console.log(`🟢 REAL Short liquidations: ${shortLiquidations.length}`);

  // Verificar sobreposição (deve ser zero)
  const longAssetNames = new Set(longLiquidations.map(a => a.asset));
  const shortAssetNames = new Set(shortLiquidations.map(a => a.asset));
  const overlap = [...longAssetNames].filter(name => shortAssetNames.has(name));

  if (overlap.length > 0) {
    console.warn(`⚠️ OVERLAP detected in REAL data: ${overlap.length} assets`);
  } else {
    console.log(`✅ PERFECT: No overlap in REAL liquidation data`);
  }

  const memoizedData = useMemo(() => ({
    longLiquidations,
    shortLiquidations,
    totalAssets: longLiquidations.length + shortLiquidations.length,
    hasOverlap: overlap.length > 0,
    overlapCount: overlap.length,
    isRealData: true,
    professionalData: true
  }), [longLiquidations, shortLiquidations, overlap.length]);

  return memoizedData;
};
