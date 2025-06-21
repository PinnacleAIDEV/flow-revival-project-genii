
import { useLongLiquidations } from './useLongLiquidations';
import { useShortLiquidations } from './useShortLiquidations';
import { useMemo } from 'react';

export const useSeparatedLiquidations = () => {
  const { longLiquidations } = useLongLiquidations();
  const { shortLiquidations } = useShortLiquidations();

  // Logs detalhados para debug
  console.log(`🔴 Long liquidations disponíveis: ${longLiquidations.length}`);
  longLiquidations.forEach((asset, index) => {
    if (index < 3) { // Log apenas os primeiros 3 para não poluir
      console.log(`🔴 LONG ${asset.asset}: longLiquidated=$${(asset.longLiquidated/1000).toFixed(0)}K, positions=${asset.longPositions}`);
    }
  });

  console.log(`🟢 Short liquidations disponíveis: ${shortLiquidations.length}`);
  shortLiquidations.forEach((asset, index) => {
    if (index < 3) { // Log apenas os primeiros 3 para não poluir
      console.log(`🟢 SHORT ${asset.asset}: shortLiquidated=$${(asset.shortLiquidated/1000).toFixed(0)}K, positions=${asset.shortPositions}`);
    }
  });

  // Verificar se há sobreposição de assets (problema potencial)
  const longAssetNames = new Set(longLiquidations.map(a => a.asset));
  const shortAssetNames = new Set(shortLiquidations.map(a => a.asset));
  const overlap = [...longAssetNames].filter(name => shortAssetNames.has(name));
  
  if (overlap.length > 0) {
    console.warn(`⚠️ OVERLAP DETECTADO: ${overlap.length} assets aparecem em ambas as listas:`, overlap.slice(0, 5));
  }

  // Memoizar para evitar re-renders desnecessários
  const memoizedData = useMemo(() => ({
    longLiquidations,
    shortLiquidations,
    totalAssets: longLiquidations.length + shortLiquidations.length,
    hasOverlap: overlap.length > 0,
    overlapCount: overlap.length
  }), [longLiquidations, shortLiquidations, overlap.length]);

  return memoizedData;
};
