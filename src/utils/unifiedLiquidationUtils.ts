import { UnifiedLiquidationAsset, LiquidationBubble, TrendReversal } from '../types/liquidation';
import { safeCreateDate, formatAmount } from './liquidationUtils';

// Criar ou atualizar asset unificado
export const createOrUpdateUnifiedAsset = (
  existingAssets: Map<string, UnifiedLiquidationAsset> | UnifiedLiquidationAsset,
  liquidation: LiquidationBubble
): UnifiedLiquidationAsset => {
  // Se existingAssets não é um Map, significa que é um asset individual sendo atualizado
  let existing: UnifiedLiquidationAsset | undefined;
  
  if (existingAssets instanceof Map) {
    existing = existingAssets.get(liquidation.asset);
  } else {
    // É um asset individual sendo passado para atualização
    existing = existingAssets.asset === liquidation.asset ? existingAssets : undefined;
  }
  
  const now = new Date();
  
  if (existing) {
    console.log(`🔄 ATUALIZANDO ${liquidation.asset}: Tipo ${liquidation.type.toUpperCase()}`);
    
    // CRUCIAL: Atualizar APENAS o tipo correto, não misturar
    const updatedAsset: UnifiedLiquidationAsset = {
      ...existing,
      price: liquidation.price,
      lastUpdateTime: now,
      
      // SEPARADO: Atualizar apenas contadores do tipo correto
      longPositions: liquidation.type === 'long' ? existing.longPositions + 1 : existing.longPositions,
      shortPositions: liquidation.type === 'short' ? existing.shortPositions + 1 : existing.shortPositions,
      totalPositions: existing.totalPositions + 1,
      
      // SEPARADO: Acumular apenas totais do tipo correto
      longLiquidated: liquidation.type === 'long' ? 
        existing.longLiquidated + liquidation.amount : existing.longLiquidated,
      shortLiquidated: liquidation.type === 'short' ? 
        existing.shortLiquidated + liquidation.amount : existing.shortLiquidated,
      
      // Total combinado para estatísticas gerais
      combinedTotal: existing.combinedTotal + liquidation.amount,
      
      // Atualizar métricas
      intensity: Math.max(existing.intensity, liquidation.intensity),
      volatility: Math.abs(liquidation.change24h),
      
      // Adicionar ao histórico
      liquidationHistory: [
        ...existing.liquidationHistory.slice(-19), // Manter últimos 20
        {
          type: liquidation.type,
          amount: liquidation.amount,
          timestamp: now,
          change24h: liquidation.change24h
        }
      ]
    };
    
    // CRUCIAL: Determinar tipo dominante baseado em valores SEPARADOS
    if (updatedAsset.longLiquidated > 0 && updatedAsset.shortLiquidated === 0) {
      updatedAsset.dominantType = 'long';
    } else if (updatedAsset.shortLiquidated > 0 && updatedAsset.longLiquidated === 0) {
      updatedAsset.dominantType = 'short';
    } else if (updatedAsset.longLiquidated > updatedAsset.shortLiquidated * 1.5) {
      updatedAsset.dominantType = 'long';
    } else if (updatedAsset.shortLiquidated > updatedAsset.longLiquidated * 1.5) {
      updatedAsset.dominantType = 'short';
    } else {
      updatedAsset.dominantType = 'balanced';
    }
    
    console.log(`✅ ATUALIZADO ${liquidation.asset}: L=${(updatedAsset.longLiquidated/1000).toFixed(0)}K, S=${(updatedAsset.shortLiquidated/1000).toFixed(0)}K, Dom=${updatedAsset.dominantType}`);
    
    return updatedAsset;
  } else {
    console.log(`🆕 CRIANDO NOVO ${liquidation.asset}: Tipo ${liquidation.type.toUpperCase()}`);
    
    // CRUCIAL: Criar asset com valores SEPARADOS desde o início
    const newAsset: UnifiedLiquidationAsset = {
      asset: liquidation.asset,
      ticker: liquidation.asset + 'USDT',
      price: liquidation.price,
      marketCap: liquidation.marketCap,
      
      // SEPARADO: Inicializar contadores corretos
      longPositions: liquidation.type === 'long' ? 1 : 0,
      shortPositions: liquidation.type === 'short' ? 1 : 0,
      totalPositions: 1,
      
      // SEPARADO: Inicializar totais corretos
      longLiquidated: liquidation.type === 'long' ? liquidation.amount : 0,
      shortLiquidated: liquidation.type === 'short' ? liquidation.amount : 0,
      combinedTotal: liquidation.amount,
      
      lastUpdateTime: now,
      firstDetectionTime: now,
      
      dominantType: liquidation.type,
      volatility: Math.abs(liquidation.change24h),
      intensity: liquidation.intensity,
      
      liquidationHistory: [{
        type: liquidation.type,
        amount: liquidation.amount,
        timestamp: now,
        change24h: liquidation.change24h
      }]
    };
    
    console.log(`✅ CRIADO ${liquidation.asset}: L=${(newAsset.longLiquidated/1000).toFixed(0)}K, S=${(newAsset.shortLiquidated/1000).toFixed(0)}K, Dom=${newAsset.dominantType}`);
    
    return newAsset;
  }
};

// Filtros adaptativos por market cap
export const getAdaptiveFilters = (marketCap: 'high' | 'low') => {
  if (marketCap === 'high') {
    return {
      minAmount: 100000, // $100K mínimo para high cap
      minPositions: 2,   // Mínimo 2 posições liquidadas
      minIntensity: 2,   // Intensidade mínima 2
      maxAssets: 20      // Máximo 20 assets high cap por lista
    };
  } else {
    return {
      minAmount: 25000,  // $25K mínimo para low cap
      minPositions: 1,   // Mínimo 1 posição liquidada
      minIntensity: 1,   // Intensidade mínima 1
      maxAssets: 30      // Máximo 30 assets low cap por lista
    };
  }
};

// Ordenar assets por relevância para cada tipo
export const sortAssetsByRelevance = (
  assets: UnifiedLiquidationAsset[],
  type: 'long' | 'short'
): UnifiedLiquidationAsset[] => {
  return assets.sort((a, b) => {
    // Prioridade 1: Total liquidado do tipo específico
    const aAmount = type === 'long' ? a.longLiquidated : a.shortLiquidated;
    const bAmount = type === 'long' ? b.longLiquidated : b.shortLiquidated;
    
    if (aAmount !== bAmount) {
      return bAmount - aAmount;
    }
    
    // Prioridade 2: Quantidade de posições do tipo
    const aPositions = type === 'long' ? a.longPositions : a.shortPositions;
    const bPositions = type === 'long' ? b.longPositions : b.shortPositions;
    
    if (aPositions !== bPositions) {
      return bPositions - aPositions;
    }
    
    // Prioridade 3: Recência
    const aTime = safeCreateDate(a.lastUpdateTime).getTime();
    const bTime = safeCreateDate(b.lastUpdateTime).getTime();
    
    return bTime - aTime;
  });
};

// Detectar trend reversals
export const detectTrendReversals = (
  unifiedAssets: Map<string, UnifiedLiquidationAsset>
): TrendReversal[] => {
  const reversals: TrendReversal[] = [];
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  
  unifiedAssets.forEach((asset, assetName) => {
    const history = asset.liquidationHistory;
    
    if (history.length < 6) return; // Precisamos de pelo menos 6 pontos
    
    // Filtrar histórico recente (últimos 30 min)
    const recentHistory = history.filter(h => 
      safeCreateDate(h.timestamp).getTime() > thirtyMinutesAgo.getTime()
    );
    
    if (recentHistory.length < 4) return;
    
    // Dividir em dois períodos
    const midPoint = Math.floor(recentHistory.length / 2);
    const firstPeriod = recentHistory.slice(0, midPoint);
    const secondPeriod = recentHistory.slice(midPoint);
    
    // Calcular dominância por período
    const firstPeriodStats = calculatePeriodStats(firstPeriod);
    const secondPeriodStats = calculatePeriodStats(secondPeriod);
    
    // Detectar reversão significativa
    if (firstPeriodStats.dominantType !== secondPeriodStats.dominantType &&
        firstPeriodStats.dominantType !== 'balanced' &&
        secondPeriodStats.dominantType !== 'balanced') {
      
      const reversalRatio = secondPeriodStats.dominantVolume / firstPeriodStats.dominantVolume;
      
      if (reversalRatio >= 1.5) { // Mínimo 50% de aumento
        const sentimentAnalysis = analyzeSentimentShift(firstPeriodStats, secondPeriodStats, asset);
        
        const reversal: TrendReversal = {
          asset: assetName,
          previousType: firstPeriodStats.dominantType,
          currentType: secondPeriodStats.dominantType,
          previousVolume: firstPeriodStats.dominantVolume,
          currentVolume: secondPeriodStats.dominantVolume,
          reversalRatio,
          timestamp: now,
          intensity: calculateReversalIntensity(reversalRatio, asset.intensity),
          price: asset.price,
          marketCap: asset.marketCap,
          
          positionsCount: {
            previousPeriod: {
              long: firstPeriodStats.longPositions,
              short: firstPeriodStats.shortPositions
            },
            currentPeriod: {
              long: secondPeriodStats.longPositions,
              short: secondPeriodStats.shortPositions
            }
          },
          
          sentimentShift: sentimentAnalysis,
          timeframe: `${Math.round((now.getTime() - recentHistory[0].timestamp.getTime()) / 60000)}min`
        };
        
        reversals.push(reversal);
      }
    }
  });
  
  return reversals.sort((a, b) => {
    // Ordenar por intensidade e ratio de reversão
    const scoreA = a.intensity * a.reversalRatio;
    const scoreB = b.intensity * b.reversalRatio;
    return scoreB - scoreA;
  }).slice(0, 15); // Máximo 15 reversões
};

// Calcular estatísticas de um período
const calculatePeriodStats = (period: Array<{type: 'long' | 'short'; amount: number; timestamp: Date; change24h: number}>) => {
  const longVolume = period.filter(p => p.type === 'long').reduce((sum, p) => sum + p.amount, 0);
  const shortVolume = period.filter(p => p.type === 'short').reduce((sum, p) => sum + p.amount, 0);
  const longPositions = period.filter(p => p.type === 'long').length;
  const shortPositions = period.filter(p => p.type === 'short').length;
  
  let dominantType: 'long' | 'short' | 'balanced';
  let dominantVolume: number;
  
  if (longVolume > shortVolume * 1.3) {
    dominantType = 'long';
    dominantVolume = longVolume;
  } else if (shortVolume > longVolume * 1.3) {
    dominantType = 'short';
    dominantVolume = shortVolume;
  } else {
    dominantType = 'balanced';
    dominantVolume = Math.max(longVolume, shortVolume);
  }
  
  return {
    longVolume,
    shortVolume,
    longPositions,
    shortPositions,
    dominantType,
    dominantVolume,
    totalVolume: longVolume + shortVolume
  };
};

// Analisar mudança de sentimento
const analyzeSentimentShift = (
  firstPeriod: any,
  secondPeriod: any,
  asset: UnifiedLiquidationAsset
) => {
  const indicators: string[] = [];
  let confidence = 0;
  let description = '';
  
  if (firstPeriod.dominantType === 'long' && secondPeriod.dominantType === 'short') {
    description = `Parada abrupta de liquidações LONG (${formatAmount(firstPeriod.longVolume)}) seguida por início intenso de liquidações SHORT (${formatAmount(secondPeriod.shortVolume)})`;
    indicators.push('Possível reversão de tendência bearish para bullish');
    indicators.push('Traders long foram liquidados, agora shorts estão sendo liquidados');
    confidence += 30;
  } else if (firstPeriod.dominantType === 'short' && secondPeriod.dominantType === 'long') {
    description = `Parada abrupta de liquidações SHORT (${formatAmount(firstPeriod.shortVolume)}) seguida por início intenso de liquidações LONG (${formatAmount(secondPeriod.longVolume)})`;
    indicators.push('Possível reversão de tendência bullish para bearish');
    indicators.push('Traders short foram liquidados, agora longs estão sendo liquidados');
    confidence += 30;
  }
  
  // Adicionar indicadores baseados em volume
  const volumeIncrease = (secondPeriod.totalVolume / firstPeriod.totalVolume - 1) * 100;
  if (volumeIncrease > 50) {
    indicators.push(`Volume aumentou ${volumeIncrease.toFixed(0)}% - forte pressão`);
    confidence += 20;
  }
  
  // Adicionar indicadores baseados em posições
  const positionShift = Math.abs(secondPeriod.longPositions - secondPeriod.shortPositions);
  if (positionShift >= 3) {
    indicators.push(`${positionShift} posições liquidadas indicam pressão direcional`);
    confidence += 15;
  }
  
  // Adicionar indicadores baseados na intensidade
  if (asset.intensity >= 4) {
    indicators.push('Alta intensidade de liquidação indica movimento forte');
    confidence += 25;
  }
  
  return {
    description,
    confidence: Math.min(confidence, 100),
    indicators
  };
};

// Calcular intensidade da reversão
const calculateReversalIntensity = (reversalRatio: number, assetIntensity: number): number => {
  let intensity = 1;
  
  if (reversalRatio >= 5) intensity = 5;
  else if (reversalRatio >= 3) intensity = 4;
  else if (reversalRatio >= 2.5) intensity = 3;
  else if (reversalRatio >= 2) intensity = 2;
  
  // Bonus pela intensidade do asset
  if (assetIntensity >= 4) intensity = Math.min(5, intensity + 1);
  
  return intensity;
};

// Limpar assets antigos
export const cleanOldAssets = (
  assets: Map<string, UnifiedLiquidationAsset>,
  maxAgeMinutes: number = 15
): Map<string, UnifiedLiquidationAsset> => {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - maxAgeMinutes * 60 * 1000);
  const cleaned = new Map<string, UnifiedLiquidationAsset>();
  
  assets.forEach((asset, key) => {
    const lastUpdate = safeCreateDate(asset.lastUpdateTime);
    if (lastUpdate > cutoffTime) {
      cleaned.set(key, asset);
    }
  });
  
  return cleaned;
};
