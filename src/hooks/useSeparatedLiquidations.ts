
import { useLongLiquidations } from './useLongLiquidations';
import { useShortLiquidations } from './useShortLiquidations';
import { useMemo } from 'react';

export const useSeparatedLiquidations = () => {
  const { longLiquidations } = useLongLiquidations();
  const { shortLiquidations } = useShortLiquidations();

  // Log para debug
  console.log(`🔴 Long liquidations disponíveis: ${longLiquidations.length}`);
  console.log(`🟢 Short liquidations disponíveis: ${shortLiquidations.length}`);

  // Memoizar para evitar re-renders desnecessários
  const memoizedData = useMemo(() => ({
    longLiquidations,
    shortLiquidations,
    totalAssets: longLiquidations.length + shortLiquidations.length
  }), [longLiquidations, shortLiquidations]);

  return memoizedData;
};
