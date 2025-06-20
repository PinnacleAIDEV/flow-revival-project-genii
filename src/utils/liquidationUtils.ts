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

// CORRIGIDO: Thresholds mais rigorosos para evitar detecções duplas
export const calculateLongLiquidationThreshold = (
  ticker: string, 
  isHighMarketCap: boolean, 
  currentVolume: number
) => {
  // Long liquidations: detectar QUEDAS significativas (preços negativos)
  const baseThresholds = {
    highCap: { volume: 50000, priceChange: -2.0 }, // Mais rigoroso
    lowCap: { volume: 15000, priceChange: -3.0 }   // Mais rigoroso
  };
  
  const threshold = isHighMarketCap ? baseThresholds.highCap : baseThresholds.lowCap;
  
  // Ajustar threshold baseado no volume atual
  const volumeMultiplier = Math.min(Math.max(currentVolume / 100000, 0.5), 1.2);
  
  return {
    volume: threshold.volume * volumeMultiplier,
    priceChange: threshold.priceChange * volumeMultiplier
  };
};

export const calculateShortLiquidationThreshold = (
  ticker: string, 
  isHighMarketCap: boolean, 
  currentVolume: number
) => {
  // Short liquidations: detectar ALTAS significativas (preços positivos)  
  const baseThresholds = {
    highCap: { volume: 50000, priceChange: 2.0 }, // Mais rigoroso
    lowCap: { volume: 15000, priceChange: 3.0 }   // Mais rigoroso
  };
  
  const threshold = isHighMarketCap ? baseThresholds.highCap : baseThresholds.lowCap;
  
  // Ajustar threshold baseado no volume atual
  const volumeMultiplier = Math.min(Math.max(currentVolume / 100000, 0.5), 1.2);
  
  return {
    volume: threshold.volume * volumeMultiplier,
    priceChange: threshold.priceChange * volumeMultiplier
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
  
  if (combinedRatio >= 10) return 5;
  if (combinedRatio >= 5) return 4;
  if (combinedRatio >= 3) return 3;
  if (combinedRatio >= 1.5) return 2;
  return 1;
};

// CORRIGIDO: Lógica mais rigorosa para long liquidations
export const shouldDetectLongLiquidation = (
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number }
) => {
  const volumeOk = volumeValue > threshold.volume;
  const priceOk = priceChange <= threshold.priceChange; // <= para quedas significativas
  
  return volumeOk && priceOk;
};

// CORRIGIDO: Lógica mais rigorosa para short liquidations
export const shouldDetectShortLiquidation = (
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number }
) => {
  const volumeOk = volumeValue > threshold.volume;
  const priceOk = priceChange >= threshold.priceChange; // >= para altas significativas
  
  return volumeOk && priceOk;
};

// CORRIGIDO: Logging mais claro para debug
export const logLongLiquidationDetection = (
  ticker: string,
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number },
  detected: boolean
) => {
  const status = detected ? '🔴 LONG LIQUIDATION' : '❌ LONG SKIPPED';
  console.log(`${status} ${ticker}: Vol=${(volumeValue/1000).toFixed(0)}K (needs >${(threshold.volume/1000).toFixed(0)}K), Price=${priceChange.toFixed(2)}% (needs <=${threshold.priceChange.toFixed(1)}%)`);
};

export const logShortLiquidationDetection = (
  ticker: string,
  volumeValue: number,
  priceChange: number,
  threshold: { volume: number; priceChange: number },
  detected: boolean
) => {
  const status = detected ? '🟢 SHORT LIQUIDATION' : '❌ SHORT SKIPPED';
  console.log(`${status} ${ticker}: Vol=${(volumeValue/1000).toFixed(0)}K (needs >${(threshold.volume/1000).toFixed(0)}K), Price=${priceChange.toFixed(2)}% (needs >=${threshold.priceChange.toFixed(1)}%)`);
};

// PRINCIPAL: Função que detecta AMBOS os tipos corretamente
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
  
  // CRÍTICO: NUNCA retornar ambos simultaneamente
  if (longDetected && shortDetected) {
    // Priorizar pela distância mais significativa do threshold
    const longDistance = Math.abs(priceChange - longThreshold.priceChange);
    const shortDistance = Math.abs(priceChange - shortThreshold.priceChange);
    
    if (longDistance < shortDistance) {
      // Long é mais forte
      return {
        longLiquidation: {
          type: 'long' as const,
          threshold: longThreshold,
          intensity: calculateIntensity(volumeValue, priceChange, longThreshold)
        },
        shortLiquidation: null
      };
    } else {
      // Short é mais forte
      return {
        longLiquidation: null,
        shortLiquidation: {
          type: 'short' as const,
          threshold: shortThreshold,
          intensity: calculateIntensity(volumeValue, priceChange, shortThreshold)
        }
      };
    }
  }
  
  // Casos normais (apenas um tipo detectado ou nenhum)
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
