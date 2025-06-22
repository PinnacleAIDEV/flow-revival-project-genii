
import { useState, useEffect, useMemo } from 'react';
import { ShortLiquidationAsset } from '../types/separatedLiquidation';
import { useRealLiquidationData } from './useRealLiquidationData';
import { safeCreateDate } from '../utils/liquidationUtils';
import { marketCapService } from '../services/MarketCapService';

export const useRealShortLiquidations = () => {
  const { shortLiquidations } = useRealLiquidationData();
  const [shortAssets, setShortAssets] = useState<Map<string, ShortLiquidationAsset>>(new Map());

  useEffect(() => {
    if (!shortLiquidations || shortLiquidations.length === 0) return;

    const processLiquidations = async () => {
      const now = new Date();
      const updatedAssets = new Map(shortAssets);

      console.log(`🟢 PROCESSING ${shortLiquidations.length} REAL SHORT liquidations...`);

      for (const liquidation of shortLiquidations) {
        try {
          // Obter market cap real
          const realMarketCap = await marketCapService.getMarketCapCategory(liquidation.ticker);
          
          // NOVOS FILTROS: Apenas liquidações puras sem análise de preço
          const assetName = liquidation.asset;
          
          const existing = updatedAssets.get(assetName);
          if (existing) {
            const updated: ShortLiquidationAsset = {
              ...existing,
              price: liquidation.price,
              marketCap: realMarketCap,
              shortPositions: existing.shortPositions + 1,
              shortLiquidated: existing.shortLiquidated + liquidation.amount,
              lastUpdateTime: now,
              intensity: Math.max(existing.intensity, liquidation.intensity),
              volatility: 0,
              liquidationHistory: [
                ...existing.liquidationHistory.slice(-19),
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
              marketCap: realMarketCap,
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

          console.log(`🟢 REAL SHORT: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K (${realMarketCap} cap)`);
        } catch (error) {
          console.error('❌ Error processing REAL SHORT liquidation:', error, liquidation);
        }
      }

      setShortAssets(updatedAssets);
    };

    processLiquidations();
  }, [shortLiquidations]);

  // Auto cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Cleaning old REAL SHORT assets...');
      
      setShortAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes
        const cleaned = new Map<string, ShortLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          const lastUpdate = safeCreateDate(asset.lastUpdateTime);
          if (lastUpdate > cutoffTime) {
            cleaned.set(key, asset);
          }
        });
        
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removed ${removed} old REAL SHORT assets`);
        }
        return cleaned;
      });
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const filteredShortAssets = useMemo(() => {
    const assetsArray = Array.from(shortAssets.values());
    
    const sorted = assetsArray.sort((a, b) => {
      return b.shortLiquidated - a.shortLiquidated;
    });
    
    console.log(`🟢 REAL SHORT ASSETS FILTERED: ${sorted.length}`);
    
    return sorted.slice(0, 50);
  }, [shortAssets]);

  return {
    shortLiquidations: filteredShortAssets,
    shortAssets,
    isRealData: true
  };
};
