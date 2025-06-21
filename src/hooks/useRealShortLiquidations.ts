
import { useState, useEffect, useMemo } from 'react';
import { ShortLiquidationAsset } from '../types/separatedLiquidation';
import { useRealLiquidationData } from './useRealLiquidationData';
import { safeCreateDate } from '../utils/liquidationUtils';

export const useRealShortLiquidations = () => {
  const { shortLiquidations } = useRealLiquidationData();
  const [shortAssets, setShortAssets] = useState<Map<string, ShortLiquidationAsset>>(new Map());

  // FILTROS MAIS RIGOROSOS - 50-80% de redução
  const MINIMUM_LIQUIDATION_AMOUNT = 15000; // Aumentado de $5K para $15K
  const MINIMUM_POSITIONS_COUNT = 3; // Mínimo 3 posições liquidadas
  const MINIMUM_INTENSITY = 2; // Intensidade mínima 2
  const HIGH_CAP_MINIMUM = 25000; // $25K para high cap
  const LOW_CAP_MINIMUM = 8000; // $8K para low cap

  useEffect(() => {
    if (!shortLiquidations || shortLiquidations.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(shortAssets);

    console.log(`🟢 PROCESSING ${shortLiquidations.length} REAL SHORT liquidations with ENHANCED FILTERS...`);

    shortLiquidations.forEach(liquidation => {
      try {
        // FILTRO 1: Valor mínimo baseado no market cap
        const minAmount = liquidation.marketCap === 'high' ? HIGH_CAP_MINIMUM : LOW_CAP_MINIMUM;
        if (liquidation.amount < minAmount) {
          return; // Rejeitar liquidações pequenas
        }

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
              ...existing.liquidationHistory.slice(-19),
              {
                type: 'short',
                amount: liquidation.amount,
                timestamp: now,
                change24h: 0
              }
            ]
          };
          
          // FILTRO 2: Só manter se passou dos limites mínimos
          if (updated.shortLiquidated >= MINIMUM_LIQUIDATION_AMOUNT && 
              updated.shortPositions >= MINIMUM_POSITIONS_COUNT) {
            updatedAssets.set(assetName, updated);
            console.log(`🟢 FILTERED SHORT: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K (Total: $${(updated.shortLiquidated/1000).toFixed(1)}K)`);
          }
        } else {
          // FILTRO 3: Nova entrada - já deve passar do mínimo na primeira liquidação
          if (liquidation.amount >= minAmount * 0.8) { // 80% do mínimo para primeira entrada
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
            console.log(`🟢 NEW FILTERED SHORT: ${assetName} - $${(liquidation.amount/1000).toFixed(1)}K`);
          }
        }
      } catch (error) {
        console.error('❌ Error processing REAL SHORT liquidation:', error, liquidation);
      }
    });

    setShortAssets(updatedAssets);
  }, [shortLiquidations]);

  // Auto cleanup - mais agressivo
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Cleaning old REAL SHORT assets with ENHANCED filters...');
      
      setShortAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 20 * 60 * 1000); // Reduzido para 20 minutos
        const cleaned = new Map<string, ShortLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          const lastUpdate = safeCreateDate(asset.lastUpdateTime);
          
          // FILTRO TEMPORAL + QUALIDADE
          if (lastUpdate > cutoffTime && 
              asset.shortLiquidated >= MINIMUM_LIQUIDATION_AMOUNT &&
              asset.shortPositions >= MINIMUM_POSITIONS_COUNT &&
              asset.intensity >= MINIMUM_INTENSITY) {
            cleaned.set(key, asset);
          }
        });
        
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removed ${removed} old/weak REAL SHORT assets`);
        }
        return cleaned;
      });
    }, 45000); // Cleanup mais frequente - 45s

    return () => clearInterval(cleanupInterval);
  }, []);

  const filteredShortAssets = useMemo(() => {
    const assetsArray = Array.from(shortAssets.values());
    
    // FILTRO FINAL: Só os mais relevantes
    const filtered = assetsArray.filter(asset => {
      return asset.shortLiquidated >= MINIMUM_LIQUIDATION_AMOUNT &&
             asset.shortPositions >= MINIMUM_POSITIONS_COUNT &&
             asset.intensity >= MINIMUM_INTENSITY;
    });
    
    const sorted = filtered.sort((a, b) => {
      // Priorizar por valor total liquidado
      return b.shortLiquidated - a.shortLiquidated;
    });
    
    console.log(`🟢 ENHANCED FILTERED SHORT ASSETS: ${sorted.length} (from ${assetsArray.length} total)`);
    
    return sorted.slice(0, 25); // Reduzido de 50 para 25
  }, [shortAssets]);

  return {
    shortLiquidations: filteredShortAssets,
    shortAssets,
    isRealData: true
  };
};
