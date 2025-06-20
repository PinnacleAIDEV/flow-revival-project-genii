
import { useState, useEffect, useCallback } from 'react';
import { LiquidationBubble } from '../types/liquidation';

export interface LiquidationSnapshot {
  timestamp: Date;
  type: 'long' | 'short';
  volume: number;
  intensity: number;
  price: number;
  change24h: number;
}

export interface TrendReversal {
  asset: string;
  fromType: 'long' | 'short';
  toType: 'long' | 'short';
  strength: number;
  volumeRatio: number;
  intensityDelta: number;
  timeFrame: number; // minutos
  reason: string;
  currentLiquidation: LiquidationBubble;
  lastProcessed: Date;
}

export const useTrendReversalHistory = () => {
  const [assetHistory, setAssetHistory] = useState<Map<string, LiquidationSnapshot[]>>(new Map());
  const [detectedReversals, setDetectedReversals] = useState<TrendReversal[]>([]);
  const [cooldownAssets, setCooldownAssets] = useState<Map<string, Date>>(new Map());

  // Limpeza automática a cada minuto
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

      // Limpar histórico > 5 minutos
      setAssetHistory(prev => {
        const cleaned = new Map();
        prev.forEach((snapshots, asset) => {
          const validSnapshots = snapshots.filter(snap => snap.timestamp > fiveMinutesAgo);
          if (validSnapshots.length > 0) {
            cleaned.set(asset, validSnapshots);
          }
        });
        return cleaned;
      });

      // Limpar cooldowns > 2 minutos
      setCooldownAssets(prev => {
        const cleaned = new Map();
        prev.forEach((cooldownTime, asset) => {
          if (cooldownTime > twoMinutesAgo) {
            cleaned.set(asset, cooldownTime);
          }
        });
        return cleaned;
      });

      console.log('🧹 Limpeza do histórico de reversões concluída');
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const addLiquidationSnapshot = useCallback((liquidation: LiquidationBubble) => {
    const snapshot: LiquidationSnapshot = {
      timestamp: new Date(),
      type: liquidation.type,
      volume: liquidation.amount,
      intensity: liquidation.intensity,
      price: liquidation.price,
      change24h: liquidation.change24h
    };

    setAssetHistory(prev => {
      const newHistory = new Map(prev);
      const existing = newHistory.get(liquidation.asset) || [];
      const updated = [...existing, snapshot].slice(-10); // Manter só últimos 10 snapshots
      newHistory.set(liquidation.asset, updated);
      return newHistory;
    });
  }, []);

  const calculateReversalStrength = (
    volumeRatio: number,
    intensityDelta: number,
    timeFrame: number,
    isHighMarketCap: boolean
  ): number => {
    const volumeScore = Math.min(volumeRatio * 30, 30);
    const intensityScore = Math.min(intensityDelta * 20, 40);
    const timeFrameBonus = Math.max(25 - timeFrame * 5, 0); // Mais pontos para mudanças rápidas
    const marketCapMultiplier = isHighMarketCap ? 25 : 15;
    
    return volumeScore + intensityScore + timeFrameBonus + marketCapMultiplier;
  };

  const detectTrendReversal = useCallback((liquidation: LiquidationBubble): TrendReversal | null => {
    const now = new Date();
    
    // Verificar cooldown
    const cooldownTime = cooldownAssets.get(liquidation.asset);
    if (cooldownTime && (now.getTime() - cooldownTime.getTime()) < 2 * 60 * 1000) {
      return null;
    }

    const history = assetHistory.get(liquidation.asset) || [];
    if (history.length < 2) return null;

    // Buscar padrão de reversão nos últimos 3 minutos
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
    const recentHistory = history.filter(snap => snap.timestamp > threeMinutesAgo);
    
    if (recentHistory.length < 2) return null;

    // Detectar mudança de direção dominante
    const currentType = liquidation.type;
    const previousTypes = recentHistory
      .filter(snap => snap.type !== currentType)
      .slice(-3); // Últimas 3 ocorrências do tipo oposto

    if (previousTypes.length === 0) return null;

    // Calcular médias do período anterior
    const previousAvgVolume = previousTypes.reduce((sum, snap) => sum + snap.volume, 0) / previousTypes.length;
    const previousAvgIntensity = previousTypes.reduce((sum, snap) => sum + snap.intensity, 0) / previousTypes.length;
    
    // Verificar se há mudança significativa
    const volumeRatio = liquidation.amount / previousAvgVolume;
    const intensityDelta = Math.abs(liquidation.intensity - previousAvgIntensity);
    const timeFrame = (now.getTime() - previousTypes[0].timestamp.getTime()) / (1000 * 60);

    // Critérios para reversão válida
    const isValidReversal = (
      volumeRatio >= 1.5 && // Volume 50% maior
      intensityDelta >= 1 && // Mudança de intensidade significativa
      timeFrame <= 3 // Dentro de 3 minutos
    );

    if (!isValidReversal) return null;

    const isHighMarketCap = liquidation.marketCap === 'high';
    const strength = calculateReversalStrength(volumeRatio, intensityDelta, timeFrame, isHighMarketCap);

    const reversal: TrendReversal = {
      asset: liquidation.asset,
      fromType: previousTypes[0].type,
      toType: currentType,
      strength,
      volumeRatio,
      intensityDelta,
      timeFrame,
      reason: `Reversão ${previousTypes[0].type.toUpperCase()}→${currentType.toUpperCase()}: Volume ${volumeRatio.toFixed(1)}x, Intensidade Δ${intensityDelta.toFixed(1)}`,
      currentLiquidation: liquidation,
      lastProcessed: now
    };

    // Adicionar ao cooldown
    setCooldownAssets(prev => new Map(prev).set(liquidation.asset, now));

    return reversal;
  }, [assetHistory, cooldownAssets]);

  const processLiquidation = useCallback((liquidation: LiquidationBubble) => {
    // Adicionar ao histórico
    addLiquidationSnapshot(liquidation);
    
    // Detectar reversão
    const reversal = detectTrendReversal(liquidation);
    if (reversal) {
      setDetectedReversals(prev => {
        const updated = [reversal, ...prev].slice(0, 20); // Manter só top 20
        return updated.sort((a, b) => b.strength - a.strength);
      });
      
      console.log(`🔄 TREND REVERSAL DETECTED: ${reversal.asset} ${reversal.fromType}→${reversal.toType} (Força: ${reversal.strength.toFixed(0)})`);
    }
  }, [addLiquidationSnapshot, detectTrendReversal]);

  return {
    detectedReversals,
    processLiquidation,
    assetHistorySize: assetHistory.size
  };
};
