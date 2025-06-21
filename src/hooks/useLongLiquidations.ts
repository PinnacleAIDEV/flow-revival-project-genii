
import { useState, useEffect, useMemo } from 'react';
import { UnifiedLiquidationAsset, getMarketCapCategory } from '../types/liquidation';
import { safeCreateDate } from '../utils/liquidationUtils';
import { useRealFlowData } from './useRealFlowData';
import { useSupabaseStorage } from './useSupabaseStorage';

export const useLongLiquidations = () => {
  const { flowData } = useRealFlowData();
  const { saveLiquidation } = useSupabaseStorage();
  
  const [longAssets, setLongAssets] = useState<Map<string, UnifiedLiquidationAsset>>(new Map());
  const [processedLongTickers, setProcessedLongTickers] = useState<Set<string>>(new Set());

  // Processar EXCLUSIVAMENTE liquidações LONG - SEM FILTROS DE PREÇO
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(longAssets);

    // SIMPLES: Apenas volume alto indica liquidação LONG
    const longLiquidationData = flowData.filter((data, index, self) => {
      const key = `long-${data.ticker}-${data.timestamp}`;
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
        !processedLongTickers.has(key) &&
        index === self.findIndex(d => d.ticker === data.ticker) &&
        volumeValue > minVolume
      );
    });

    console.log(`🔴 PROCESSANDO ${longLiquidationData.length} LONG liquidations (apenas volume)...`);

    longLiquidationData.forEach(data => {
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
        
        console.log(`🔴 LONG LIQUIDATION DETECTADA: ${data.ticker} - Vol: $${(volumeValue/1000).toFixed(0)}K`);
        
        // Criar/atualizar asset LONG EXCLUSIVO
        const existing = updatedAssets.get(assetName);
        if (existing) {
          const updated: UnifiedLiquidationAsset = {
            ...existing,
            price: data.price,
            longPositions: existing.longPositions + 1,
            longLiquidated: existing.longLiquidated + volumeValue,
            combinedTotal: existing.longLiquidated + volumeValue + existing.shortLiquidated,
            lastUpdateTime: now,
            intensity: Math.max(existing.intensity, intensity),
            volatility: Math.abs(priceChange),
            dominantType: 'long',
            liquidationHistory: [
              ...existing.liquidationHistory.slice(-19),
              {
                type: 'long',
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
            longPositions: 1,
            shortPositions: 0,
            totalPositions: 1,
            longLiquidated: volumeValue,
            shortLiquidated: 0,
            combinedTotal: volumeValue,
            lastUpdateTime: now,
            firstDetectionTime: now,
            dominantType: 'long',
            volatility: Math.abs(priceChange),
            intensity,
            liquidationHistory: [{
              type: 'long',
              amount: volumeValue,
              timestamp: now,
              change24h: priceChange
            }]
          };
          updatedAssets.set(assetName, newAsset);
        }
        
        // Salvar no Supabase como LONG
        saveLiquidation({
          asset: assetName,
          ticker: data.ticker,
          type: 'long',
          amount: volumeValue,
          price: data.price,
          market_cap: marketCap,
          intensity,
          change_24h: priceChange,
          volume: data.volume,
          total_liquidated: volumeValue,
          volume_spike: 1
        });

        setProcessedLongTickers(prev => new Set([...prev, `long-${data.ticker}-${data.timestamp}`]));
      } catch (error) {
        console.error('❌ Erro ao processar LONG liquidação:', error, data);
      }
    });

    setLongAssets(updatedAssets);
  }, [flowData, saveLiquidation]);

  // Limpeza automática
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Limpando LONG assets antigos...');
      
      setLongAssets(prev => {
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
          console.log(`🗑️ Removidos ${removed} LONG assets antigos`);
        }
        return cleaned;
      });

      setProcessedLongTickers(new Set());
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Filtrar e ordenar assets LONG
  const filteredLongAssets = useMemo(() => {
    const assetsArray = Array.from(longAssets.values());
    
    // Ordenar APENAS por valores LONG
    const sorted = assetsArray.sort((a, b) => {
      if (a.longLiquidated !== b.longLiquidated) {
        return b.longLiquidated - a.longLiquidated;
      }
      return b.longPositions - a.longPositions;
    });
    
    console.log(`🔴 LONG ASSETS FILTRADOS: ${sorted.length}`);
    sorted.forEach(asset => {
      console.log(`🔴 ${asset.asset}: $${(asset.longLiquidated/1000).toFixed(0)}K (${asset.longPositions} pos LONG)`);
    });
    
    return sorted.slice(0, 50);
  }, [longAssets]);

  return {
    longLiquidations: filteredLongAssets,
    longAssets
  };
};
