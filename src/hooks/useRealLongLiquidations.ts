
import { useState, useEffect, useMemo } from 'react';
import { LongLiquidationAsset } from '../types/separatedLiquidation';
import { useRealLiquidationData } from './useRealLiquidationData';
import { safeCreateDate } from '../utils/liquidationUtils';

export const useRealLongLiquidations = () => {
  const { longLiquidations } = useRealLiquidationData();
  const [longAssets, setLongAssets] = useState<Map<string, LongLiquidationAsset>>(new Map());

  // FILTROS MAIS MODERADOS - Foco em controlar repetições
  const MINIMUM_LIQUIDATION_AMOUNT = 5000; // Reduzido de $15K para $5K
  const MINIMUM_POSITIONS_COUNT = 1; // Reduzido de 3 para 1
  const MINIMUM_INTENSITY = 1; // Reduzido de 2 para 1
  const HIGH_CAP_MINIMUM = 8000; // Reduzido de $25K para $8K
  const LOW_CAP_MINIMUM = 3000; // Reduzido de $8K para $3K

  useEffect(() => {
    if (!longLiquidations || longLiquidations.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(longAssets);

    console.log(`🔴 PROCESSING ${longLiquidations.length} REAL LONG liquidations with MODERATE FILTERS...`);

    longLiquidations.forEach(liquidation => {
      try {
        // FILTRO MODERADO: Valor mínimo baseado no market cap
        const minAmount = liquidation.marketCap === 'high' ? HIGH_CAP_MINIMUM : LOW_CAP_MINIMUM;
        if (liquidation.amount < minAmount) {
          return;
        }

        const assetName = liquidation.asset;
        
        const existing = updatedAssets.get(assetName);
        if (existing) {
          // CONTROLE DE REPETIÇÕES: Limitar updates muito frequentes do mesmo ativo
          const timeSinceLastUpdate = now.getTime() - safeCreateDate(existing.lastUpdateTime).getTime();
          if (timeSinceLastUpdate < 30000) { // 30 segundos entre updates do mesmo ativo
            console.log(`⏰ THROTTLED: ${assetName} - Last update too recent (${Math.floor(timeSinceLastUpdate/1000)}s ago)`);
            return;
          }

          const updated: LongLiquidationAsset = {
            ...existing,
            price: liquidation.price,
            longPositions: existing.longPositions + 1,
            longLiquidated: existing.longLiquidated + liquidation.amount,
            lastUpdateTime: now,
            intensity: Math.max(existing.intensity, liquidation.intensity),
            volatility: 0,
            liquidationHistory: [
              ...existing.liquidationHistory.slice(-29), // Aumentado de 19 para 29
              {
                type: 'long',
                amount: liquidation.amount,
                timestamp: now,
                change24h: 0
              }
            ]
          };
          
          updatedAssets.set(assetName, updated);
          console.log(`🔴 UPDATED LONG: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K (Total: $${(updated.longLiquidated/1000).toFixed(1)}K, Positions: ${updated.longPositions})`);
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
        console.error('❌ Error processing REAL LONG liquidation:', error, liquidation);
      }
    });

    setLongAssets(updatedAssets);
  }, [longLiquidations]);

  // Auto cleanup - menos agressivo
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Cleaning old REAL LONG assets with MODERATE filters...');
      
      setLongAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 45 * 60 * 1000); // Aumentado para 45 minutos
        const cleaned = new Map<string, LongLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          const lastUpdate = safeCreateDate(asset.lastUpdateTime);
          
          // FILTRO TEMPORAL MODERADO
          if (lastUpdate > cutoffTime && 
              asset.longLiquidated >= MINIMUM_LIQUIDATION_AMOUNT &&
              asset.longPositions >= MINIMUM_POSITIONS_COUNT) {
            cleaned.set(key, asset);
          }
        });
        
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removed ${removed} old REAL LONG assets`);
        }
        return cleaned;
      });
    }, 60000); // Cleanup menos frequente - 60s

    return () => clearInterval(cleanupInterval);
  }, []);

  const filteredLongAssets = useMemo(() => {
    const assetsArray = Array.from(longAssets.values());
    
    // FILTRO FINAL MODERADO
    const filtered = assetsArray.filter(asset => {
      return asset.longLiquidated >= MINIMUM_LIQUIDATION_AMOUNT &&
             asset.longPositions >= MINIMUM_POSITIONS_COUNT &&
             asset.intensity >= MINIMUM_INTENSITY;
    });
    
    const sorted = filtered.sort((a, b) => {
      return b.longLiquidated - a.longLiquidated;
    });
    
    console.log(`🔴 MODERATE FILTERED LONG ASSETS: ${sorted.length} (from ${assetsArray.length} total)`);
    
    return sorted.slice(0, 50); // Aumentado de 25 para 50
  }, [longAssets]);

  return {
    longLiquidations: filteredLongAssets,
    longAssets,
    isRealData: true
  };
};
