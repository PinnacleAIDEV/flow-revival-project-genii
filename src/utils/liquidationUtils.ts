
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

// NOVA LÓGICA: Thresholds específicos para cada tipo de liquidação
export const calculateLongLiquidationThreshold = (
  ticker: string, 
  isHighMarketCap: boolean, 
  currentVolume: number
) => {
  // Long liquidations: detectar QUEDAS bruscas
  const baseThresholds = {
    highCap: { volume: 50000, priceChange: -2.5 }, // Queda mínima de -2.5%
    lowCap: { volume: 15000, priceChange: -4.0 }   // Queda mínima de -4.0%
  };
  
  const threshold = isHighMarketCap ? baseThresholds.highCap : baseThresholds.lowCap;
  
  // Ajustar threshold baseado no volume atual
  const volumeMultiplier = Math.min(Math.max(currentVolume / 100000, 0.5), 2.0);
  
  return {
    volume: threshold.volume * volumeMultiplier,
    priceChange: threshold.priceChange / volumeMultiplier // Quedas mais severas com mais volume
  };
};

export const calculateShortLiquidationThreshold = (
  ticker: string, 
  isHighMarketCap: boolean, 
  currentVolume: number
) => {
  // Short liquidations: detectar ALTAS bruscas
  const baseThresholds = {
    highCap: { volume: 50000, priceChange: 2.5 }, // Alta mínima de +2.5%
    lowCap: { volume: 15000, priceChange: 4.0 }   // Alta mínima de +4.0%
  };
  
  const threshold = isHighMarketCap ? baseThresholds.highCap : baseThresholds.lowCap;
  
  // Ajustar threshold baseado no volume atual
  const volumeMultiplier = Math.min(Math.max(currentVolume / 100000, 0.5), 2.0);
  
  return {
    volume: threshold.volume * volumeMultiplier,
    priceChange: threshold.priceChange / volumeMultiplier // Altas mais severas com mais volume
  };
};

export const calculateIntensity = (
  volumeValue: number, 
  priceChange: number, 
  threshold: { volume: number; priceChange: number }
) => {
  const volumeRatio = volumeValue / threshold.volume;
  const priceRatio = Math.abs(priceChange) / Math.abs(threshold.priceChange);
  const combinedRatio = (volumeRatio + priceRatio) / 2;
  
  if (combinedRatio >= 15) return 5;
  if (combinedRatio >= 8) return 4;
  if (combinedRatio >= 4) return 3;
  if (combinedRatio >= 2) return 2;
  return 1;
};

// NOVA: Detecção específica para Long liquidations (quedas bruscas)
export const shouldDetectLongLiquidation = (
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number }
) => {
  return volumeValue > threshold.volume && priceChange <= threshold.priceChange; // <= para quedas
};

// NOVA: Detecção específica para Short liquidations (altas bruscas)
export const shouldDetectShortLiquidation = (
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number }
) => {
  return volumeValue > threshold.volume && priceChange >= threshold.priceChange; // >= para altas
};

// Logging utilities para debugging com lógicas específicas
export const logLongLiquidationDetection = (
  ticker: string,
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number },
  detected: boolean
) => {
  const status = detected ? '🔴 LONG DETECTED' : '❌ LONG SKIPPED';
  console.log(`${status} ${ticker}: Vol=${(volumeValue/1000).toFixed(0)}K (>${(threshold.volume/1000).toFixed(0)}K), Fall=${priceChange.toFixed(2)}% (<=${threshold.priceChange.toFixed(1)}%)`);
};

export const logShortLiquidationDetection = (
  ticker: string,
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number },
  detected: boolean
) => {
  const status = detected ? '🟢 SHORT DETECTED' : '❌ SHORT SKIPPED';
  console.log(`${status} ${ticker}: Vol=${(volumeValue/1000).toFixed(0)}K (>${(threshold.volume/1000).toFixed(0)}K), Rise=${priceChange.toFixed(2)}% (>=${threshold.priceChange.toFixed(1)}%)`);
};

// NOVA: Função para detectar ambos os tipos de liquidação de forma espelhada
export const detectLiquidations = (
  ticker: string,
  volumeValue: number,
  priceChange: number,
  isHighMarketCap: boolean
) => {
  const longThreshold = calculateLongLiquidationThreshold(ticker, isHighMarketCap, volumeValue);
  const shortThreshold = calculateShortLiquidationThreshold(ticker, isHighMarketCap, volumeValue);
  
  const longDetected = shouldDetectLongLiquidation(volumeValue, priceChange, longThreshold);
  const shortDetected = shouldDetectShortLiquidation(volumeValue, priceChange, shortThreshold);
  
  // Log ambas as detecções
  logLongLiquidationDetection(ticker, volumeValue, priceChange, longThreshold, longDetected);
  logShortLiquidationDetection(ticker, volumeValue, priceChange, shortThreshold, shortDetected);
  
  return {
    longLiquidation: longDetected ? {
      type: 'long' as const,
      threshold: longThreshold,
      intensity: calculateIntensity(volumeValue, priceChange, longThreshold)
    } : null,
    shortLiquidation: shortDetected ? {
      type: 'short' as const,
      threshold: shortThreshold,
      intensity: calculateIntensity(volumeValue, priceChange, shortThreshold)
    } : null
  };
};

// NOVA: Função para calcular score de relevância atual
export const calculateRelevanceScore = (liquidation: LiquidationBubble): number => {
  const now = new Date();
  const lastUpdateTime = safeCreateDate(liquidation.lastUpdateTime); // FIX: Use safeCreateDate
  const minutesAgo = (now.getTime() - lastUpdateTime.getTime()) / 60000;
  
  // Decay temporal: menos relevante com o tempo (0% relevância após 15min)
  const timeDecay = Math.max(0, 1 - (minutesAgo / 15));
  
  // Score baseado em fatores ATUAIS
  const intensityScore = liquidation.intensity * 20; // 20-100 pontos
  const currentAmountScore = Math.log10(Math.max(liquidation.amount, 1)) * 10; // Log scale
  const volatilityScore = Math.abs(liquidation.change24h) * 2; // Volatilidade atual
  
  const finalScore = (intensityScore + currentAmountScore + volatilityScore) * timeDecay;
  
  return Math.max(0, finalScore);
};

// NOVA: Logging detalhado para decisões de filtro
export const logFilteringDecision = (
  liquidation: LiquidationBubble, 
  score: number, 
  included: boolean,
  reason: string = ''
) => {
  const status = included ? '✅ INCLUDED' : '❌ FILTERED';
  const lastUpdateTime = safeCreateDate(liquidation.lastUpdateTime); // FIX: Use safeCreateDate
  const minutesAgo = Math.round((Date.now() - lastUpdateTime.getTime()) / 60000);
  
  console.log(`${status} ${liquidation.asset}: Score=${score.toFixed(1)} ` +
             `(Current=${formatAmount(liquidation.amount)}, ` +
             `Intensity=${liquidation.intensity}, ` +
             `Age=${minutesAgo}min, ` +
             `Total=${formatAmount(liquidation.totalLiquidated)}) ${reason}`);
};

// NOVA: Análise de balanceamento
export const analyzeBalance = (longLiquidations: LiquidationBubble[], shortLiquidations: LiquidationBubble[]) => {
  const longHighCapCurrent = longLiquidations.filter(l => l.marketCap === 'high')
    .reduce((sum, l) => sum + l.amount, 0);
  const longLowCapCurrent = longLiquidations.filter(l => l.marketCap === 'low')
    .reduce((sum, l) => sum + l.amount, 0);
  
  const shortHighCapCurrent = shortLiquidations.filter(l => l.marketCap === 'high')
    .reduce((sum, l) => sum + l.amount, 0);
  const shortLowCapCurrent = shortLiquidations.filter(l => l.marketCap === 'low')
    .reduce((sum, l) => sum + l.amount, 0);
  
  console.log(`💰 BALANCE CHECK ATUAL:`);
  console.log(`- Long: High Cap ${formatAmount(longHighCapCurrent)} | Low Cap ${formatAmount(longLowCapCurrent)}`);
  console.log(`- Short: High Cap ${formatAmount(shortHighCapCurrent)} | Low Cap ${formatAmount(shortLowCapCurrent)}`);
  
  const totalCurrent = longHighCapCurrent + longLowCapCurrent + shortHighCapCurrent + shortLowCapCurrent;
  console.log(`- Total liquidado atual: ${formatAmount(totalCurrent)}`);
};

// NOVA: Atualização com janela deslizante (30min máximo)
export const updateLiquidationWithTimeLimit = (
  existing: LiquidationBubble, 
  newAmount: number
): LiquidationBubble => {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const lastUpdateTime = safeCreateDate(existing.lastUpdateTime); // FIX: Use safeCreateDate
  
  // Reset acumulação se muito antiga
  const shouldReset = lastUpdateTime < thirtyMinutesAgo;
  
  if (shouldReset) {
    const minutesOld = Math.round((now.getTime() - lastUpdateTime.getTime()) / 60000);
    console.log(`🔄 RESET ACUMULAÇÃO: ${existing.asset} (${minutesOld}min antiga)`);
  }
  
  return {
    ...existing,
    amount: newAmount, // SEMPRE o valor atual da liquidação
    totalLiquidated: shouldReset ? newAmount : existing.totalLiquidated + newAmount,
    lastUpdateTime: now
  };
};

interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number;
  change24h: number;
  volume: number;
  lastUpdateTime: Date;
  totalLiquidated: number;
}
