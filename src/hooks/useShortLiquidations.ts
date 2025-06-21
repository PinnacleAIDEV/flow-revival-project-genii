
import { useState, useEffect, useMemo } from 'react';
import { ShortLiquidationAsset } from '../types/separatedLiquidation';
import { safeCreateDate } from '../utils/liquidationUtils';
import { useLiquidationDataDistributor } from './useLiquidationDataDistributor';
import { useOptimizedSupabaseStorage } from './useOptimizedSupabaseStorage';

export const useShortLiquidations = () => {
  const { shortFlowData } = useLiquidationDataDistributor();
  const { saveCriticalLiquidation } = useOptimizedSupabaseStorage();
  
  const [shortAssets, setShortAssets] = useState<Map<string, ShortLiquidationAsset>>(new Map());
  const [processedShortTickers, setProcessedShortTickers] = useState<Set<string>>(new Set());

  // Processar EXCLUSIVAMENTE dados SHORT já filtrados
  useEffect(() => {
    if (!shortFlowData || shortFlowData.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(shortAssets);

    console.log(`🟢 PROCESSANDO ${shortFlowData.length} SHORT liquidations OTIMIZADOS...`);

    // Buffer para batch operations
    const liquidationsToSave: any[] = [];

    shortFlowData.forEach(data => {
      try {
        const key = `short-${data.ticker}-${data.timestamp}`;
        
        if (processedShortTickers.has(key)) return;

        const assetName = data.ticker.replace('USDT', '');
        const minVolume = data.marketCap === 'high' ? 75000 : 25000; // Já otimizado
        const volumeRatio = data.volumeValue / minVolume;
        let intensity = Math.min(5, Math.max(1, Math.floor(volumeRatio / 2)));
        
        console.log(`🟢 SHORT LIQUIDATION: ${data.ticker} - Vol: $${(data.volumeValue/1000).toFixed(0)}K`);
        
        const existing = updatedAssets.get(assetName);
        if (existing) {
          const updated: ShortLiquidationAsset = {
            ...existing,
            price: data.price,
            shortPositions: existing.shortPositions + 1,
            shortLiquidated: existing.shortLiquidated + data.volumeValue,
            lastUpdateTime: now,
            intensity: Math.max(existing.intensity, intensity),
            volatility: Math.abs(data.change_24h),
            liquidationHistory: [
              ...existing.liquidationHistory.slice(-19),
              {
                type: 'short',
                amount: data.volumeValue,
                timestamp: now,
                change24h: data.change_24h
              }
            ]
          };
          updatedAssets.set(assetName, updated);
        } else {
          const newAsset: ShortLiquidationAsset = {
            asset: assetName,
            ticker: data.ticker,
            price: data.price,
            marketCap: data.marketCap,
            shortPositions: 1,
            shortLiquidated: data.volumeValue,
            lastUpdateTime: now,
            firstDetectionTime: now,
            volatility: Math.abs(data.change_24h),
            intensity,
            liquidationHistory: [{
              type: 'short',
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
          type: 'short',
          amount: data.volumeValue,
          price: data.price,
          market_cap: data.marketCap,
          intensity,
          change_24h: data.change_24h,
          volume: data.volume,
          total_liquidated: data.volumeValue,
          volume_spike: 1
        });

        setProcessedShortTickers(prev => new Set([...prev, key]));
      } catch (error) {
        console.error('❌ Erro ao processar SHORT liquidação:', error, data);
      }
    });

    // OTIMIZAÇÃO: Salvar apenas as liquidações críticas (redução massiva)
    liquidationsToSave.forEach(liq => {
      saveCriticalLiquidation(liq); // Só salva se atender critérios rígidos
    });

    setShortAssets(updatedAssets);
  }, [shortFlowData, saveCriticalLiquidation]);

  // Limpeza otimizada (menos frequente)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Limpando SHORT assets antigos (otimizado)...');
      
      setShortAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 20 * 60 * 1000); // 20min ao invés de 15min
        const cleaned = new Map<string, ShortLiquidationAsset>();
        
        prev.forEach((asset, key) => {
          const lastUpdate = safeCreateDate(asset.lastUpdateTime);
          if (lastUpdate > cutoffTime) {
            cleaned.set(key, asset);
          }
        });
        
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removidos ${removed} SHORT assets antigos`);
        }
        return cleaned;
      });

      setProcessedShortTickers(new Set());
    }, 90000); // 90s ao invés de 60s

    return () => clearInterval(cleanupInterval);
  }, []);

  // Filtrar e ordenar assets SHORT
  const filteredShortAssets = useMemo(() => {
    const assetsArray = Array.from(shortAssets.values());
    
    const sorted = assetsArray.sort((a, b) => {
      if (a.shortLiquidated !== b.shortLiquidated) {
        return b.shortLiquidated - a.shortLiquidated;
      }
      return b.shortPositions - a.shortPositions;
    });
    
    console.log(`🟢 SHORT ASSETS OTIMIZADOS: ${sorted.length}`);
    sorted.forEach(asset => {
      console.log(`🟢 ${asset.asset}: $${(asset.shortLiquidated/1000).toFixed(0)}K (${asset.shortPositions} pos SHORT)`);
    });
    
    return sorted.slice(0, 30); // Reduzido de 50 para 30
  }, [shortAssets]);

  return {
    shortLiquidations: filteredShortAssets,
    shortAssets
  };
};
