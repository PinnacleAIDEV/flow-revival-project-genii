import { LiquidationBubble } from '../types/liquidation';

export const safeCreateDate = (dateInput: any): Date => {
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  return new Date();
};

export const formatAmount = (amount: number): string => {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
  return `$${amount.toFixed(2)}`;
};

export const detectLiquidations = (
  ticker: string,
  volumeValue: number,
  priceChange: number,
  isHighMarketCap: boolean
) => {
  // Long liquidation detection (price falling)
  const longLiquidation = priceChange <= -2.5 && volumeValue > 50000 ? {
    intensity: Math.min(5, Math.abs(priceChange) / 2)
  } : null;

  // Short liquidation detection (price rising)
  const shortLiquidation = priceChange >= 2.5 && volumeValue > 50000 ? {
    intensity: Math.min(5, priceChange / 2)
  } : null;

  return { longLiquidation, shortLiquidation };
};

export const calculateRelevanceScore = (liquidation: LiquidationBubble): number => {
  let score = 0;
  
  // Market cap scoring
  if (liquidation.marketCap === 'high') score += 50;
  else if (liquidation.marketCap === 'mid') score += 30;
  else score += 10;
  
  // Volume scoring
  score += Math.min(30, liquidation.amount / 1000000);
  
  // Price change scoring
  score += Math.min(20, Math.abs(liquidation.change24h));
  
  return score;
};

export const logFilteringDecision = (
  liquidation: LiquidationBubble,
  score: number,
  isSelected: boolean,
  reason: string
): void => {
  console.log(`🎯 ${liquidation.asset} (${liquidation.marketCap.toUpperCase()}) - Score: ${score.toFixed(1)} - ${isSelected ? '✅ SELECTED' : '❌ FILTERED'} - ${reason}`);
};

export const analyzeBalance = (
  longLiquidations: LiquidationBubble[],
  shortLiquidations: LiquidationBubble[]
): void => {
  const longByMarketCap = {
    high: longLiquidations.filter(l => l.marketCap === 'high').length,
    mid: longLiquidations.filter(l => l.marketCap === 'mid').length,
    low: longLiquidations.filter(l => l.marketCap === 'low').length
  };
  
  const shortByMarketCap = {
    high: shortLiquidations.filter(l => l.marketCap === 'high').length,
    mid: shortLiquidations.filter(l => l.marketCap === 'mid').length,
    low: shortLiquidations.filter(l => l.marketCap === 'low').length
  };
  
  console.log('📊 BALANCE ANALYSIS:');
  console.log(`- Long: High=${longByMarketCap.high}, Mid=${longByMarketCap.mid}, Low=${longByMarketCap.low}`);
  console.log(`- Short: High=${shortByMarketCap.high}, Mid=${shortByMarketCap.mid}, Low=${shortByMarketCap.low}`);
};

export const updateLiquidationWithTimeLimit = (
  existing: LiquidationBubble,
  newAmount: number
): LiquidationBubble => {
  const now = new Date();
  const timeWindow = 5 * 60 * 1000; // 5 minutes
  
  // If the existing liquidation is within the time window, accumulate
  if (now.getTime() - existing.lastUpdateTime.getTime() < timeWindow) {
    return {
      ...existing,
      amount: newAmount,
      totalLiquidated: existing.totalLiquidated + newAmount,
      lastUpdateTime: now
    };
  }
  
  // Otherwise, reset with new amount
  return {
    ...existing,
    amount: newAmount,
    totalLiquidated: newAmount,
    lastUpdateTime: now
  };
};
