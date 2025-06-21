
// DEPRECATED: Use useRealSeparatedLiquidations instead
// This hook now redirects to REAL data for backward compatibility

import { useRealSeparatedLiquidations } from './useRealSeparatedLiquidations';

export const useSeparatedLiquidations = () => {
  console.warn('⚠️ useSeparatedLiquidations is DEPRECATED. Use useRealSeparatedLiquidations for REAL Force Order data.');
  
  // Redirect to REAL data
  const realData = useRealSeparatedLiquidations();
  
  return {
    ...realData,
    // Add compatibility warning
    isDeprecated: true,
    useRealDataInstead: 'useRealSeparatedLiquidations'
  };
};
