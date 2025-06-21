
import { useState, useEffect, useMemo } from 'react';
import { LongLiquidationAsset } from '../types/separatedLiquidation';
import { useRealLiquidationData } from './useRealLiquidationData';
import { safeCreateDate } from '../utils/liquidationUtils';

export const useRealLongLiquidations = () => {
  const { longLiquidations } = useRealLiquidationData();
  const [longAssets, setLongAssets] = useState<Map<string, LongLiquidationAsset>>(new Map());

  useEffect(() => {
    if (!longLiquidations || longLiquidations.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(longAssets);

    console.log(`🔴 Processing ${longLiquidations.length} REAL LONG liquidations...`);

    longLiquidations.forEach(liquidation => {
      try {
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
            volatility: 0,
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
          console.log(`🔴 UPDATED LONG: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K (Total: $${(updated.longLiquidated/1000).toFixed(1)}K)`);
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
          console.log(`🔴 NEW LONG: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K`);
        }
      } catch (error) {
        console.error('❌ Error processing LONG liquidation:', error, liquidation);
      }
    });

    setLongAssets(updatedAssets);
  }, [longLiquidations]);

  // Cleanup simples - apenas remove ativos muito antigos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setLongAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hora
        const cleaned = new Map<string, LongLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          const lastUpdate = safeCreateDate(asset.lastUpdateTime);
          if (lastUpdate > cutoffTime) {
            cleaned.set(key, asset);
          }
        });
        
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removed ${removed} old LONG assets`);
        }
        return cleaned;
      });
    }, 120000); // Cleanup a cada 2 minutos

    return () => clearInterval(cleanupInterval);
  }, []);

  const filteredLongAssets = useMemo(() => {
    const assetsArray = Array.from(longAssets.values());
    
    // Ordenar apenas por valor total liquidado
    const sorted = assetsArray.sort((a, b) => {
      return b.longLiquidated - a.longLiquidated;
    });
    
    console.log(`🔴 LONG ASSETS: ${sorted.length}`);
    
    return sorted.slice(0, 100);
  }, [longAssets]);

  return {
    longLiquidations: filteredLongAssets,
    longAssets,
    isRealData: true
  };
};
