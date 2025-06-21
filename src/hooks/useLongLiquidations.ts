
import { useState, useEffect, useMemo } from 'react';
import { LongLiquidationAsset } from '../types/separatedLiquidation';
import { safeCreateDate } from '../utils/liquidationUtils';
import { useLiquidationDataDistributor } from './useLiquidationDataDistributor';
import { useOptimizedSupabaseStorage } from './useOptimizedSupabaseStorage';

export const useLongLiquidations = () => {
  const { longFlowData } = useLiquidationDataDistributor();
  const { saveCriticalLiquidation } = useOptimizedSupabaseStorage();
  
  const [longAssets, setLongAssets] = useState<Map<string, LongLiquidationAsset>>(new Map());
  const [processedLongTickers, setProcessedLongTickers] = useState<Set<string>>(new Set());

  // Processar EXCLUSIVAMENTE dados LONG já filtrados
  useEffect(() => {
    if (!longFlowData || longFlowData.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(longAssets);

    console.log(`🔴 PROCESSANDO ${longFlowData.length} LONG liquidations OTIMIZADOS...`);

    // Buffer para batch operations
    const liquidationsToSave: any[] = [];

    longFlowData.forEach(data => {
      try {
        const key = `long-${data.ticker}-${data.timestamp}`;
        
        if (processedLongTickers.has(key)) return;

        const assetName = data.ticker.replace('USDT', '');
        const minVolume = data.marketCap === 'high' ? 75000 : 25000; // Já otimizado
        const volumeRatio = data.volumeValue / minVolume;
        let intensity = Math.min(5, Math.max(1, Math.floor(volumeRatio / 2)));
        
        console.log(`🔴 LONG LIQUIDATION: ${data.ticker} - Vol: $${(data.volumeValue/1000).toFixed(0)}K`);
        
        const existing = updatedAssets.get(assetName);
        if (existing) {
          const updated: LongLiquidationAsset = {
            ...existing,
            price: data.price,
            longPositions: existing.longPositions + 1,
            longLiquidated: existing.longLiquidated + data.volumeValue,
            lastUpdateTime: now,
            intensity: Math.max(existing.intensity, intensity),
            volatility: Math.abs(data.change_24h),
            liquidationHistory: [
              ...existing.liquidationHistory.slice(-19),
              {
                type: 'long',
                amount: data.volumeValue,
                timestamp: now,
                change24h: data.change_24h
              }
            ]
          };
          updatedAssets.set(assetName, updated);
        } else {
          const newAsset: LongLiquidationAsset = {
            asset: assetName,
            ticker: data.ticker,
            price: data.price,
            marketCap: data.marketCap,
            longPositions: 1,
            longLiquidated: data.volumeValue,
            lastUpdateTime: now,
            firstDetectionTime: now,
            volatility: Math.abs(data.change_24h),
            intensity,
            liquidationHistory: [{
              type: 'long',
              amount: data.volumeValue,
              timestamp: now,
              change24h: data.change_24h
            }]
          };
          updatedAssets.set(assetName, newAsset);
        }
        
        // OTIMIZAÇÃO: Apenas preparar para salvar, não salvar imediatamente
        liquidationsToSave.push({
          asset: assetName,
          ticker: data.ticker,
          type: 'long',
          amount: data.volumeValue,
          price: data.price,
          market_cap: data.marketCap,
          intensity,
          change_24h: data.change_24h,
          volume: data.volume,
          total_liquidated: data.volumeValue,
          volume_spike: 1
        });

        setProcessedLongTickers(prev => new Set([...prev, key]));
      } catch (error) {
        console.error('❌ Erro ao processar LONG liquidação:', error, data);
      }
    });

    // OTIMIZAÇÃO: Salvar apenas as liquidações críticas (redução massiva)
    liquidationsToSave.forEach(liq => {
      saveCriticalLiquidation(liq); // Só salva se atender critérios rígidos
    });

    setLongAssets(updatedAssets);
  }, [longFlowData, saveCriticalLiquidation]);

  // Limpeza otimizada (menos frequente)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Limpando LONG assets antigos (otimizado)...');
      
      setLongAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 20 * 60 * 1000); // 20min ao invés de 15min
        const cleaned = new Map<string, LongLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          const lastUpdate = safeCreateDate(asset.lastUpdateTime);
          if (lastUpdate > cutoffTime) {
            cleaned.set(key, asset);
          }
        });
        
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removidos ${removed} LONG assets antigos`);
        }
        return cleaned;
      });

      setProcessedLongTickers(new Set());
    }, 90000); // 90s ao invés de 60s

    return () => clearInterval(cleanupInterval);
  }, []);

  // Filtrar e ordenar assets LONG
  const filteredLongAssets = useMemo(() => {
    const assetsArray = Array.from(longAssets.values());
    
    const sorted = assetsArray.sort((a, b) => {
      if (a.longLiquidated !== b.longLiquidated) {
        return b.longLiquidated - a.longLiquidated;
      }
      return b.longPositions - a.longPositions;
    });
    
    console.log(`🔴 LONG ASSETS OTIMIZADOS: ${sorted.length}`);
    sorted.forEach(asset => {
      console.log(`🔴 ${asset.asset}: $${(asset.longLiquidated/1000).toFixed(0)}K (${asset.longPositions} pos LONG)`);
    });
    
    return sorted.slice(0, 30); // Reduzido de 50 para 30
  }, [longAssets]);

  return {
    longLiquidations: filteredLongAssets,
    longAssets
  };
};
