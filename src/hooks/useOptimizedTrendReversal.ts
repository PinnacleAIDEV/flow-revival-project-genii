import { useState, useEffect, useMemo } from 'react';
import { useRealLongLiquidations } from './useRealLongLiquidations';
import { useRealShortLiquidations } from './useRealShortLiquidations';
import { signalThrottleManager } from '../utils/signalThrottling';

interface TrendReversalSignal {
  id: string;
  asset: string;
  ticker: string;
  patternType: 'FLIP' | 'CASCADE' | 'SQUEEZE' | 'WHALE' | 'MOMENTUM_SHIFT';
  description: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  timestamp: Date;
  data: {
    longVolume: number;
    shortVolume: number;
    dominantType: 'long' | 'short';
    previousDominant?: 'long' | 'short';
    volumeRatio: number;
    intensity: number;
  };
}

interface AssetSnapshot {
  asset: string;
  longVolume: number;
  shortVolume: number;
  dominantType: 'long' | 'short';
  timestamp: Date;
  totalVolume: number;
}

export const useOptimizedTrendReversal = () => {
  const { longLiquidations } = useRealLongLiquidations();
  const { shortLiquidations } = useRealShortLiquidations();
  const [signals, setSignals] = useState<TrendReversalSignal[]>([]);
  const [assetHistory, setAssetHistory] = useState<Map<string, AssetSnapshot[]>>(new Map());

  // Consolidar dados de liquidações em snapshots
  const currentSnapshots = useMemo(() => {
    const snapshots = new Map<string, AssetSnapshot>();
    const now = new Date();

    // Processar liquidações LONG
    longLiquidations.forEach(longAsset => {
      const snapshot: AssetSnapshot = {
        asset: longAsset.asset,
        longVolume: longAsset.longLiquidated,
        shortVolume: 0,
        dominantType: 'long',
        timestamp: now,
        totalVolume: longAsset.longLiquidated
      };
      snapshots.set(longAsset.asset, snapshot);
    });

    // Processar liquidações SHORT e merge com LONG
    shortLiquidations.forEach(shortAsset => {
      const existing = snapshots.get(shortAsset.asset);
      if (existing) {
        const totalLong = existing.longVolume;
        const totalShort = shortAsset.shortLiquidated;
        
        existing.shortVolume = totalShort;
        existing.totalVolume = totalLong + totalShort;
        existing.dominantType = totalLong > totalShort ? 'long' : 'short';
      } else {
        const snapshot: AssetSnapshot = {
          asset: shortAsset.asset,
          longVolume: 0,
          shortVolume: shortAsset.shortLiquidated,
          dominantType: 'short',
          timestamp: now,
          totalVolume: shortAsset.shortLiquidated
        };
        snapshots.set(shortAsset.asset, snapshot);
      }
    });

    console.log(`🔄 TREND REVERSAL: ${snapshots.size} ativos processados`);
    return snapshots;
  }, [longLiquidations, shortLiquidations]);

  // Atualizar histórico de snapshots
  useEffect(() => {
    if (currentSnapshots.size === 0) return;

    setAssetHistory(prevHistory => {
      const newHistory = new Map(prevHistory);
      const cutoffTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos

      currentSnapshots.forEach((snapshot, asset) => {
        const history = newHistory.get(asset) || [];
        
        // Adicionar novo snapshot se volume mudou significativamente
        const lastSnapshot = history[history.length - 1];
        const shouldAdd = !lastSnapshot || 
          Math.abs(lastSnapshot.totalVolume - snapshot.totalVolume) > 15000 || // $15K mudança
          lastSnapshot.dominantType !== snapshot.dominantType;

        if (shouldAdd) {
          // Filtrar histórico antigo
          const recentHistory = history.filter(h => h.timestamp > cutoffTime);
          recentHistory.push(snapshot);
          
          // Manter apenas últimos 5 snapshots
          newHistory.set(asset, recentHistory.slice(-5));
        }
      });

      return newHistory;
    });
  }, [currentSnapshots]);

  // Detectar padrões de reversão
  useEffect(() => {
    const detectedSignals: TrendReversalSignal[] = [];
    const now = new Date();

    assetHistory.forEach((history, asset) => {
      if (history.length < 2) return;

      const current = history[history.length - 1];
      const previous = history[history.length - 2];
      const beforePrevious = history.length >= 3 ? history[history.length - 3] : null;

      // 1. LIQUIDATION FLIP (Mudança de dominância)
      if (previous.dominantType !== current.dominantType) {
        const minVolume = 25000; // $25K mínimo
        const prevVolume = previous.dominantType === 'long' ? previous.longVolume : previous.shortVolume;
        const currVolume = current.dominantType === 'long' ? current.longVolume : current.shortVolume;
        
        if (prevVolume > minVolume && currVolume > minVolume && 
            signalThrottleManager.canGenerateSignal(asset, 'FLIP')) {
          
          const volumeRatio = currVolume / Math.max(prevVolume, 1000);
          const signal: TrendReversalSignal = {
            id: `${asset}-flip-${now.getTime()}`,
            asset,
            ticker: `${asset}USDT`,
            patternType: 'FLIP',
            description: `Trend Flip: ${previous.dominantType.toUpperCase()} → ${current.dominantType.toUpperCase()}`,
            confidence: Math.min(95, 50 + (currVolume / 2000)),
            severity: currVolume > 100000 ? 'EXTREME' : currVolume > 50000 ? 'HIGH' : 'MEDIUM',
            timestamp: current.timestamp,
            data: {
              longVolume: current.longVolume,
              shortVolume: current.shortVolume,
              dominantType: current.dominantType,
              previousDominant: previous.dominantType,
              volumeRatio,
              intensity: Math.min(10, Math.floor(currVolume / 10000))
            }
          };

          detectedSignals.push(signal);
          signalThrottleManager.recordSignal(asset, 'FLIP');
          
          console.log(`🔄 FLIP: ${asset} - ${previous.dominantType} → ${current.dominantType} ($${(currVolume/1000).toFixed(0)}K)`);
        }
      }

      // 2. MOMENTUM CASCADE (Aceleração na mesma direção)
      if (beforePrevious && 
          beforePrevious.dominantType === previous.dominantType && 
          previous.dominantType === current.dominantType) {
        
        const getVolume = (snap: AssetSnapshot) => 
          snap.dominantType === 'long' ? snap.longVolume : snap.shortVolume;
        
        const vol1 = getVolume(beforePrevious);
        const vol2 = getVolume(previous);
        const vol3 = getVolume(current);
        
        // Volume crescente em padrão acelerado
        if (vol1 < vol2 && vol2 < vol3 && vol3 > 30000 && 
            (vol3 - vol2) > (vol2 - vol1) && // Aceleração
            signalThrottleManager.canGenerateSignal(asset, 'CASCADE')) {
          
          const signal: TrendReversalSignal = {
            id: `${asset}-cascade-${now.getTime()}`,
            asset,
            ticker: `${asset}USDT`,
            patternType: 'CASCADE',
            description: `Momentum Cascade: ${current.dominantType.toUpperCase()} acelerando`,
            confidence: Math.min(90, 60 + ((vol3 - vol1) / 2000)),
            severity: vol3 > 200000 ? 'EXTREME' : vol3 > 80000 ? 'HIGH' : 'MEDIUM',
            timestamp: current.timestamp,
            data: {
              longVolume: current.longVolume,
              shortVolume: current.shortVolume,
              dominantType: current.dominantType,
              volumeRatio: vol3 / Math.max(vol1, 1000),
              intensity: Math.min(10, Math.floor((vol3 - vol1) / 15000))
            }
          };

          detectedSignals.push(signal);
          signalThrottleManager.recordSignal(asset, 'CASCADE');
          
          console.log(`⚡ CASCADE: ${asset} - ${current.dominantType} momentum ($${(vol3/1000).toFixed(0)}K)`);
        }
      }

      // 3. BILATERAL SQUEEZE (Alto volume em ambos os lados)
      if (current.longVolume > 40000 && current.shortVolume > 40000) {
        const ratio = Math.min(current.longVolume, current.shortVolume) / Math.max(current.longVolume, current.shortVolume);
        
        if (ratio > 0.65 && signalThrottleManager.canGenerateSignal(asset, 'SQUEEZE')) {
          const signal: TrendReversalSignal = {
            id: `${asset}-squeeze-${now.getTime()}`,
            asset,
            ticker: `${asset}USDT`,
            patternType: 'SQUEEZE',
            description: `Bilateral Squeeze: Liquidações intensas em ambos os lados`,
            confidence: Math.min(85, 40 + (ratio * 55)),
            severity: current.totalVolume > 200000 ? 'EXTREME' : 'HIGH',
            timestamp: current.timestamp,
            data: {
              longVolume: current.longVolume,
              shortVolume: current.shortVolume,
              dominantType: current.dominantType,
              volumeRatio: ratio,
              intensity: Math.min(10, Math.floor(current.totalVolume / 25000))
            }
          };

          detectedSignals.push(signal);
          signalThrottleManager.recordSignal(asset, 'SQUEEZE');
          
          console.log(`🤏 SQUEEZE: ${asset} - Bilateral ($${(current.totalVolume/1000).toFixed(0)}K)`);
        }
      }

      // 4. WHALE LIQUIDATION (Volume extremo)
      const maxSingleVolume = Math.max(current.longVolume, current.shortVolume);
      if (maxSingleVolume > 300000 && signalThrottleManager.canGenerateSignal(asset, 'WHALE')) {
        const signal: TrendReversalSignal = {
          id: `${asset}-whale-${now.getTime()}`,
          asset,
          ticker: `${asset}USDT`,
          patternType: 'WHALE',
          description: `Whale Alert: ${maxSingleVolume === current.longVolume ? 'LONG' : 'SHORT'} extrema`,
          confidence: Math.min(98, 75 + (maxSingleVolume / 15000)),
          severity: 'EXTREME',
          timestamp: current.timestamp,
          data: {
            longVolume: current.longVolume,
            shortVolume: current.shortVolume,
            dominantType: current.dominantType,
            volumeRatio: maxSingleVolume / Math.max(current.totalVolume - maxSingleVolume, 1000),
            intensity: 10
          }
        };

        detectedSignals.push(signal);
        signalThrottleManager.recordSignal(asset, 'WHALE');
        
        console.log(`🐋 WHALE: ${asset} - ${maxSingleVolume === current.longVolume ? 'LONG' : 'SHORT'} ($${(maxSingleVolume/1000).toFixed(0)}K)`);
      }
    });

    // Atualizar sinais ordenados por severidade e timestamp
    if (detectedSignals.length > 0) {
      setSignals(prev => {
        const combined = [...detectedSignals, ...prev];
        const severityOrder = { 'EXTREME': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        
        return combined
          .sort((a, b) => {
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;
            return b.timestamp.getTime() - a.timestamp.getTime();
          })
          .slice(0, 20); // Manter apenas 20 sinais mais relevantes
      });
    }

    // Limpeza automática de sinais antigos (mais de 15 minutos)
    setSignals(prev => prev.filter(signal => 
      (now.getTime() - signal.timestamp.getTime()) < 15 * 60 * 1000
    ));

  }, [assetHistory]);

  return {
    signals,
    totalAssets: currentSnapshots.size,
    totalSignals: signals.length,
    highSeveritySignals: signals.filter(s => s.severity === 'EXTREME' || s.severity === 'HIGH').length,
    assetHistory
  };
};