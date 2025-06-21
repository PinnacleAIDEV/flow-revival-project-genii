
// DEPRECATED: Use useRealShortLiquidations instead
// This hook now redirects to REAL data for backward compatibility

import { useRealShortLiquidations } from './useRealShortLiquidations';

export const useShortLiquidations = () => {
  console.warn('⚠️ useShortLiquidations is DEPRECATED. Use useRealShortLiquidations for REAL Force Order data.');
  
  // Redirect to REAL data
  const realData = useRealShortLiquidations();
  
  return {
    ...realData,
    // Add compatibility warning
    isDeprecated: true,
    useRealDataInstead: 'useRealShortLiquidations'
  };
};
