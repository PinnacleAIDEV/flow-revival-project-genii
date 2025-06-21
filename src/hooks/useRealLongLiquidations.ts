
import { useState, useEffect, useMemo } from 'react';
import { LongLiquidationAsset } from '../types/separatedLiquidation';
import { useRealLiquidationData } from './useRealLiquidationData';

export const useRealLongLiquidations = () => {
  const { longLiquidations } = useRealLiquidationData();
  const [longAssets, setLongAssets] = useState<Map<string, LongLiquidationAsset>>(new Map());

  useEffect(() => {
    if (!longLiquidations || longLiquidations.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(longAssets);

    longLiquidations.forEach(liquidation => {
      const assetName = liquidation.asset;
      
      const existing = updatedAssets.get(assetName);
      if (existing) {
        const updated: LongLiquidationAsset = {
          ...existing,
          price: liquidation.price,
          longPositions: existing.longPositions + 1,
          longLiquidated: existing.longLiquidated + liquidation.amount,
          lastUpdateTime: now,
          intensity: Math.max(existing.intensity, liquidation.intensity),
          liquidationHistory: [
            ...existing.liquidationHistory.slice(-49),
            {
              type: 'long',
              amount: liquidation.amount,
              timestamp: now,
              change24h: 0
            }
          ]
        };
        
        updatedAssets.set(assetName, updated);
      } else {
        const newAsset: LongLiquidationAsset = {
          asset: assetName,
          ticker: liquidation.ticker,
          price: liquidation.price,
          marketCap: liquidation.marketCap,
          longPositions: 1,
          longLiquidated: liquidation.amount,
          lastUpdateTime: now,
          firstDetectionTime: now,
          volatility: 0,
          intensity: liquidation.intensity,
          liquidationHistory: [{
            type: 'long',
            amount: liquidation.amount,
            timestamp: now,
            change24h: 0
          }]
        };
        updatedAssets.set(assetName, newAsset);
      }
    });

    setLongAssets(updatedAssets);
  }, [longLiquidations]);

  // Cleanup simples
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setLongAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutos
        const cleaned = new Map<string, LongLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          if (asset.lastUpdateTime > cutoffTime) {
            cleaned.set(key, asset);
          }
        });
        
        return cleaned;
      });
    }, 60000); // Cleanup a cada minuto

    return () => clearInterval(cleanupInterval);
  }, []);

  const filteredLongAssets = useMemo(() => {
    const assetsArray = Array.from(longAssets.values());
    return assetsArray.sort((a, b) => b.longLiquidated - a.longLiquidated);
  }, [longAssets]);

  return {
    longLiquidations: filteredLongAssets,
    longAssets,
    isRealData: true
  };
};
