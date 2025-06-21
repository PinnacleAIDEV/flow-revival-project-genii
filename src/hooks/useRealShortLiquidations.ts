
import { useState, useEffect, useMemo } from 'react';
import { ShortLiquidationAsset } from '../types/separatedLiquidation';
import { useRealLiquidationData } from './useRealLiquidationData';

export const useRealShortLiquidations = () => {
  const { shortLiquidations } = useRealLiquidationData();
  const [shortAssets, setShortAssets] = useState<Map<string, ShortLiquidationAsset>>(new Map());

  useEffect(() => {
    if (!shortLiquidations || shortLiquidations.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(shortAssets);

    shortLiquidations.forEach(liquidation => {
      const assetName = liquidation.asset;
      
      const existing = updatedAssets.get(assetName);
      if (existing) {
        const updated: ShortLiquidationAsset = {
          ...existing,
          price: liquidation.price,
          shortPositions: existing.shortPositions + 1,
          shortLiquidated: existing.shortLiquidated + liquidation.amount,
          lastUpdateTime: now,
          intensity: Math.max(existing.intensity, liquidation.intensity),
          liquidationHistory: [
            ...existing.liquidationHistory.slice(-49),
            {
              type: 'short',
              amount: liquidation.amount,
              timestamp: now,
              change24h: 0
            }
          ]
        };
        
        updatedAssets.set(assetName, updated);
      } else {
        const newAsset: ShortLiquidationAsset = {
          asset: assetName,
          ticker: liquidation.ticker,
          price: liquidation.price,
          marketCap: liquidation.marketCap,
          shortPositions: 1,
          shortLiquidated: liquidation.amount,
          lastUpdateTime: now,
          firstDetectionTime: now,
          volatility: 0,
          intensity: liquidation.intensity,
          liquidationHistory: [{
            type: 'short',
            amount: liquidation.amount,
            timestamp: now,
            change24h: 0
          }]
        };
        updatedAssets.set(assetName, newAsset);
      }
    });

    setShortAssets(updatedAssets);
  }, [shortLiquidations]);

  // Cleanup simples
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setShortAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutos
        const cleaned = new Map<string, ShortLiquidationAsset>();
        
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

  const filteredShortAssets = useMemo(() => {
    const assetsArray = Array.from(shortAssets.values());
    return assetsArray.sort((a, b) => b.shortLiquidated - a.shortLiquidated);
  }, [shortAssets]);

  return {
    shortLiquidations: filteredShortAssets,
    shortAssets,
    isRealData: true
  };
};
