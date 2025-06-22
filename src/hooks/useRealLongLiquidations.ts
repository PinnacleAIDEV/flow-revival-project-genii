import { useState, useEffect, useMemo } from 'react';
import { LongLiquidationAsset } from '../types/separatedLiquidation';
import { useRealLiquidationData } from './useRealLiquidationData';
import { safeCreateDate } from '../utils/liquidationUtils';
import { marketCapService } from '../services/MarketCapService';

export const useRealLongLiquidations = () => {
  const { longLiquidations } = useRealLiquidationData();
  const [longAssets, setLongAssets] = useState<Map<string, LongLiquidationAsset>>(new Map());

  useEffect(() => {
    if (!longLiquidations || longLiquidations.length === 0) return;

    const processLiquidations = async () => {
      const now = new Date();
      const updatedAssets = new Map(longAssets);

      console.log(`🔴 PROCESSING ${longLiquidations.length} REAL LONG liquidations...`);

      for (const liquidation of longLiquidations) {
        try {
          // Obter market cap real
          const realMarketCap = await marketCapService.getMarketCapCategory(liquidation.ticker);
          
          // NOVOS FILTROS: Apenas liquidações puras sem análise de preço
          const assetName = liquidation.asset;
          
          const existing = updatedAssets.get(assetName);
          if (existing) {
            const updated: LongLiquidationAsset = {
              ...existing,
              price: liquidation.price,
              marketCap: realMarketCap,
              longPositions: existing.longPositions + 1,
              longLiquidated: existing.longLiquidated + liquidation.amount,
              lastUpdateTime: now,
              intensity: Math.max(existing.intensity, liquidation.intensity),
              volatility: 0,
              liquidationHistory: [
                ...existing.liquidationHistory.slice(-19),
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
              marketCap: realMarketCap,
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

          console.log(`🔴 REAL LONG: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K (${realMarketCap} cap)`);
        } catch (error) {
          console.error('❌ Error processing REAL LONG liquidation:', error, liquidation);
        }
      }

      setLongAssets(updatedAssets);
    };

    processLiquidations();
  }, [longLiquidations]);

  // Auto cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Cleaning old REAL LONG assets...');
      
      setLongAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes
        const cleaned = new Map<string, LongLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          const lastUpdate = safeCreateDate(asset.lastUpdateTime);
          if (lastUpdate > cutoffTime) {
            cleaned.set(key, asset);
          }
        });
        
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removed ${removed} old REAL LONG assets`);
        }
        return cleaned;
      });
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const filteredLongAssets = useMemo(() => {
    const assetsArray = Array.from(longAssets.values());
    
    const sorted = assetsArray.sort((a, b) => {
      return b.longLiquidated - a.longLiquidated;
    });
    
    console.log(`🔴 REAL LONG ASSETS FILTERED: ${sorted.length}`);
    
    return sorted.slice(0, 50);
  }, [longAssets]);

  return {
    longLiquidations: filteredLongAssets,
    longAssets,
    isRealData: true
  };
};
