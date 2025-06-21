
// DEPRECATED: Use useRealLongLiquidations instead
// This hook now redirects to REAL data for backward compatibility

import { useRealLongLiquidations } from './useRealLongLiquidations';

export const useLongLiquidations = () => {
  console.warn('⚠️ useLongLiquidations is DEPRECATED. Use useRealLongLiquidations for REAL Force Order data.');
  
  // Redirect to REAL data
  const realData = useRealLongLiquidations();
  
  return {
    ...realData,
    // Add compatibility warning
    isDeprecated: true,
    useRealDataInstead: 'useRealLongLiquidations'
  };
};
