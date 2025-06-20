
// Helper function to safely create dates
export const safeCreateDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  let dateValue: Date;
  
  if (timestamp instanceof Date) {
    dateValue = timestamp;
  } else if (typeof timestamp === 'number') {
    dateValue = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    dateValue = new Date(timestamp);
  } else {
    console.warn('Invalid timestamp format:', timestamp);
    return new Date();
  }
  
  // Check if the date is valid
  if (isNaN(dateValue.getTime())) {
    console.warn('Invalid date created from timestamp:', timestamp);
    return new Date();
  }
  
  return dateValue;
};

export const formatAmount = (amount: number) => {
  if (!amount || isNaN(amount)) return '$0.00';
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
  return `$${amount.toFixed(2)}`;
};

// New: Enhanced liquidation detection utilities
export const calculateDynamicThreshold = (
  ticker: string, 
  isHighMarketCap: boolean, 
  currentVolume: number
) => {
  // Base thresholds mais equilibrados
  const baseThresholds = {
    highCap: { volume: 30000, priceChange: 1.2 },
    lowCap: { volume: 8000, priceChange: 1.8 }
  };
  
  const threshold = isHighMarketCap ? baseThresholds.highCap : baseThresholds.lowCap;
  
  // Ajustar threshold baseado no volume atual (detecção relativa)
  const volumeMultiplier = Math.min(Math.max(currentVolume / 100000, 0.5), 2.0);
  
  return {
    volume: threshold.volume * volumeMultiplier,
    priceChange: threshold.priceChange / volumeMultiplier
  };
};

export const calculateIntensity = (
  volumeValue: number, 
  priceChange: number, 
  threshold: { volume: number; priceChange: number }
) => {
  const volumeRatio = volumeValue / threshold.volume;
  const priceRatio = Math.abs(priceChange) / threshold.priceChange;
  const combinedRatio = (volumeRatio + priceRatio) / 2;
  
  if (combinedRatio >= 15) return 5;
  if (combinedRatio >= 8) return 4;
  if (combinedRatio >= 4) return 3;
  if (combinedRatio >= 2) return 2;
  return 1;
};

export const shouldDetectLiquidation = (
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number }
) => {
  return volumeValue > threshold.volume && Math.abs(priceChange) > threshold.priceChange;
};

// Logging utilities for debugging
export const logLiquidationDetection = (
  ticker: string,
  type: 'long' | 'short',
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number },
  detected: boolean
) => {
  const status = detected ? '✅ DETECTED' : '❌ SKIPPED';
  console.log(`${status} ${ticker} ${type.toUpperCase()}: Vol=${(volumeValue/1000).toFixed(0)}K (>${(threshold.volume/1000).toFixed(0)}K), Change=${priceChange.toFixed(2)}% (>${threshold.priceChange.toFixed(1)}%)`);
};
