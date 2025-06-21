
import { useState, useEffect, useMemo } from 'react';
import { UnifiedLiquidationAsset, getMarketCapCategory } from '../types/liquidation';
import { safeCreateDate } from '../utils/liquidationUtils';
import { useRealFlowData } from './useRealFlowData';
import { useSupabaseStorage } from './useSupabaseStorage';

export const useShortLiquidations = () => {
  const { flowData } = useRealFlowData();
  const { saveLiquidation } = useSupabaseStorage();
  
  const [shortAssets, setShortAssets] = useState<Map<string, UnifiedLiquidationAsset>>(new Map());
  const [processedShortTickers, setProcessedShortTickers] = useState<Set<string>>(new Set());

  // Processar EXCLUSIVAMENTE liquidações SHORT - SEM FILTROS DE PREÇO
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(shortAssets);

    // SIMPLES: Apenas volume alto indica liquidação SHORT
    const shortLiquidationData = flowData.filter((data, index, self) => {
      const key = `short-${data.ticker}-${data.timestamp}`;
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const isHighMarketCap = marketCap === 'high';
      
      // APENAS critério de volume - SEM filtro de preço
      const minVolume = isHighMarketCap ? 50000 : 15000;
      
      return (
        data.ticker && 
        !isNaN(data.price) && 
        data.price > 0 &&
        !isNaN(data.volume) && 
        data.volume > 0 &&
        !processedShortTickers.has(key) &&
        index === self.findIndex(d => d.ticker === data.ticker) &&
        volumeValue > minVolume
      );
    });

    console.log(`🟢 PROCESSANDO ${shortLiquidationData.length} SHORT liquidations (apenas volume)...`);

    shortLiquidationData.forEach(data => {
      try {
        const priceChange = data.change_24h || 0;
        const volumeValue = data.volume * data.price;
        const marketCap = getMarketCapCategory(data.ticker);
        const assetName = data.ticker.replace('USDT', '');
        
        // Intensidade baseada apenas no volume
        const isHighMarketCap = marketCap === 'high';
        const minVolume = isHighMarketCap ? 50000 : 15000;
        const volumeRatio = volumeValue / minVolume;
        
        let intensity = Math.min(5, Math.max(1, Math.floor(volumeRatio / 2)));
        
        console.log(`🟢 SHORT LIQUIDATION DETECTADA: ${data.ticker} - Vol: $${(volumeValue/1000).toFixed(0)}K`);
        
        // Criar/atualizar asset SHORT EXCLUSIVO
        const existing = updatedAssets.get(assetName);
        if (existing) {
          const updated: UnifiedLiquidationAsset = {
            ...existing,
            price: data.price,
            shortPositions: existing.shortPositions + 1,
            shortLiquidated: existing.shortLiquidated + volumeValue,
            combinedTotal: existing.shortLiquidated + volumeValue + existing.longLiquidated,
            lastUpdateTime: now,
            intensity: Math.max(existing.intensity, intensity),
            volatility: Math.abs(priceChange),
            dominantType: 'short',
            liquidationHistory: [
              ...existing.liquidationHistory.slice(-19),
              {
                type: 'short',
                amount: volumeValue,
                timestamp: now,
                change24h: priceChange
              }
            ]
          };
          updatedAssets.set(assetName, updated);
        } else {
          const newAsset: UnifiedLiquidationAsset = {
            asset: assetName,
            ticker: data.ticker,
            price: data.price,
            marketCap,
            longPositions: 0,
            shortPositions: 1,
            totalPositions: 1,
            longLiquidated: 0,
            shortLiquidated: volumeValue,
            combinedTotal: volumeValue,
            lastUpdateTime: now,
            firstDetectionTime: now,
            dominantType: 'short',
            volatility: Math.abs(priceChange),
            intensity,
            liquidationHistory: [{
              type: 'short',
              amount: volumeValue,
              timestamp: now,
              change24h: priceChange
            }]
          };
          updatedAssets.set(assetName, newAsset);
        }
        
        // Salvar no Supabase como SHORT
        saveLiquidation({
          asset: assetName,
          ticker: data.ticker,
          type: 'short',
          amount: volumeValue,
          price: data.price,
          market_cap: marketCap,
          intensity,
          change_24h: priceChange,
          volume: data.volume,
          total_liquidated: volumeValue,
          volume_spike: 1
        });

        setProcessedShortTickers(prev => new Set([...prev, `short-${data.ticker}-${data.timestamp}`]));
      } catch (error) {
        console.error('❌ Erro ao processar SHORT liquidação:', error, data);
      }
    });

    setShortAssets(updatedAssets);
  }, [flowData, saveLiquidation]);

  // Limpeza automática
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Limpando SHORT assets antigos...');
      
      setShortAssets(prev => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - 15 * 60 * 1000);
        const cleaned = new Map<string, UnifiedLiquidationAsset>();
        
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
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Filtrar e ordenar assets SHORT
  const filteredShortAssets = useMemo(() => {
    const assetsArray = Array.from(shortAssets.values());
    
    // Ordenar APENAS por valores SHORT
    const sorted = assetsArray.sort((a, b) => {
      if (a.shortLiquidated !== b.shortLiquidated) {
        return b.shortLiquidated - a.shortLiquidated;
      }
      return b.shortPositions - a.shortPositions;
    });
    
    console.log(`🟢 SHORT ASSETS FILTRADOS: ${sorted.length}`);
    sorted.forEach(asset => {
      console.log(`🟢 ${asset.asset}: $${(asset.shortLiquidated/1000).toFixed(0)}K (${asset.shortPositions} pos SHORT)`);
    });
    
    return sorted.slice(0, 50);
  }, [shortAssets]);

  return {
    shortLiquidations: filteredShortAssets,
    shortAssets
  };
};
