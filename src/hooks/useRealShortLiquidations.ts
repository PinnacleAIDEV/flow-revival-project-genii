
import { useState, useEffect, useMemo } from 'react';
import { ShortLiquidationAsset } from '../types/separatedLiquidation';
import { useRealLiquidationData } from './useRealLiquidationData';
import { safeCreateDate } from '../utils/liquidationUtils';

export const useRealShortLiquidations = () => {
  const { shortLiquidations } = useRealLiquidationData();
  const [shortAssets, setShortAssets] = useState<Map<string, ShortLiquidationAsset>>(new Map());

  useEffect(() => {
    if (!shortLiquidations || shortLiquidations.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(shortAssets);

    console.log(`🟢 Processing ${shortLiquidations.length} REAL SHORT liquidations...`);

    shortLiquidations.forEach(liquidation => {
      try {
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
            volatility: 0,
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
          console.log(`🟢 UPDATED SHORT: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K (Total: $${(updated.shortLiquidated/1000).toFixed(1)}K)`);
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
          console.log(`🟢 NEW SHORT: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K`);
        }
      } catch (error) {
        console.error('❌ Error processing SHORT liquidation:', error, liquidation);
      }
    });

    setShortAssets(updatedAssets);
  }, [shortLiquidations]);

  // Cleanup simples - apenas remove ativos muito antigos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setShortAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hora
        const cleaned = new Map<string, ShortLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          const lastUpdate = safeCreateDate(asset.lastUpdateTime);
          if (lastUpdate > cutoffTime) {
            cleaned.set(key, asset);
          }
        });
        
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removed ${removed} old SHORT assets`);
        }
        return cleaned;
      });
    }, 120000); // Cleanup a cada 2 minutos

    return () => clearInterval(cleanupInterval);
  }, []);

  const filteredShortAssets = useMemo(() => {
    const assetsArray = Array.from(shortAssets.values());
    
    // Ordenar apenas por valor total liquidado
    const sorted = assetsArray.sort((a, b) => {
      return b.shortLiquidated - a.shortLiquidated;
    });
    
    console.log(`🟢 SHORT ASSETS: ${sorted.length}`);
    
    return sorted.slice(0, 100);
  }, [shortAssets]);

  return {
    shortLiquidations: filteredShortAssets,
    shortAssets,
    isRealData: true
  };
};
