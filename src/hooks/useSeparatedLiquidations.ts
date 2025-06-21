
import { useLongLiquidations } from './useLongLiquidations';
import { useShortLiquidations } from './useShortLiquidations';

export const useSeparatedLiquidations = () => {
  const { longLiquidations } = useLongLiquidations();
  const { shortLiquidations } = useShortLiquidations();

  return {
    longLiquidations,
    shortLiquidations
  };
};
