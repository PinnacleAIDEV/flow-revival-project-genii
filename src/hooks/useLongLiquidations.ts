import { useState, useEffect, useMemo } from 'react';
import { UnifiedLiquidationAsset, getMarketCapCategory } from '../types/liquidation';
import { safeCreateDate } from '../utils/liquidationUtils';
import { useRealFlowData } from './useRealFlowData';
import { useSupabaseStorage } from './useSupabaseStorage';

export const useLongLiquidations = () => {
  const { flowData } = useRealFlowData();
  const { saveLiquidation } = useSupabaseStorage();
  
  const [longAssets, setLongAssets] = useState<Map<string, UnifiedLiquidationAsset>>(new Map());
  const [processedTickers, setProcessedTickers] = useState<Set<string>>(new Set());

  // Processar dados de liquidação LONG reais - APENAS QUEDAS
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(longAssets);

    // CRUCIAL: Filtrar RIGOROSAMENTE apenas liquidações LONG (quedas significativas)
    const longLiquidationData = flowData.filter((data, index, self) => {
      const key = `${data.ticker}-${data.timestamp}`;
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const isHighMarketCap = marketCap === 'high';
      const priceChange = data.change_24h || 0;
      
      // LIQUIDAÇÃO LONG: Apenas em QUEDAS FORTES (valores negativos significativos)
      const minVolume = isHighMarketCap ? 75000 : 25000;
      const maxPriceChange = isHighMarketCap ? -2.0 : -3.0; // QUEDAS mínimas
      
      const isValidTicker = data.ticker && !isNaN(data.price) && data.price > 0;
      const isValidVolume = !isNaN(data.volume) && data.volume > 0;
      const hasValidPriceChange = !isNaN(priceChange);
      const isNotProcessed = !processedTickers.has(key);
      const isUniqueInBatch = index === self.findIndex(d => d.ticker === data.ticker);
      const hasMinVolume = volumeValue > minVolume;
      const isSignificantDrop = priceChange <= maxPriceChange; // SÓ QUEDAS
      
      // Debug para entender filtros
      if (data.ticker === 'BTCUSDT' || data.ticker === 'ETHUSDT') {
        console.log(`🔴 LONG FILTER ${data.ticker}: Price=${priceChange.toFixed(2)}% (need <=${maxPriceChange}), Vol=$${(volumeValue/1000).toFixed(0)}K (need >${(minVolume/1000).toFixed(0)}K), Pass=${isSignificantDrop && hasMinVolume}`);
      }
      
      return (
        isValidTicker &&
        isValidVolume &&
        hasValidPriceChange &&
        isNotProcessed &&
        isUniqueInBatch &&
        hasMinVolume &&
        isSignificantDrop // CRUCIAL: SÓ QUEDAS
      );
    });

    console.log(`🔴 PROCESSANDO ${longLiquidationData.length} LONG liquidations (apenas quedas significativas)...`);

    // Processar apenas as liquidações long válidas
    longLiquidationData.forEach(data => {
      try {
        const priceChange = data.change_24h || 0;
        const volumeValue = data.volume * data.price;
        const marketCap = getMarketCapCategory(data.ticker);
        const assetName = data.ticker.replace('USDT', '');
        
        // Calcular intensidade baseada na queda
        const isHighMarketCap = marketCap === 'high';
        const minVolume = isHighMarketCap ? 75000 : 25000;
        const priceDropRatio = Math.abs(priceChange) / (isHighMarketCap ? 2.0 : 3.0);
        const volumeRatio = volumeValue / minVolume;
        const combinedRatio = (priceDropRatio + volumeRatio) / 2;
        
        let intensity = 1;
        if (combinedRatio >= 5) intensity = 5;
        else if (combinedRatio >= 3) intensity = 4;
        else if (combinedRatio >= 2) intensity = 3;
        else if (combinedRatio >= 1.5) intensity = 2;
        
        console.log(`🔴 LONG LIQUIDATION: ${data.ticker} - Queda: ${priceChange.toFixed(2)}% - Vol: $${(volumeValue/1000).toFixed(0)}K - Intensity: ${intensity}`);
        
        // Criar/atualizar asset LONG com dados separados
        const existing = updatedAssets.get(assetName);
        if (existing) {
          const updated: UnifiedLiquidationAsset = {
            ...existing,
            price: data.price,
            longPositions: existing.longPositions + 1, // INCREMENTAR APENAS LONG
            longLiquidated: existing.longLiquidated + volumeValue, // INCREMENTAR APENAS LONG
            totalPositions: (existing.longPositions + 1) + existing.shortPositions, // RECALCULAR
            combinedTotal: (existing.longLiquidated + volumeValue) + existing.shortLiquidated, // RECALCULAR
            lastUpdateTime: now,
            intensity: Math.max(existing.intensity, intensity),
            volatility: Math.abs(priceChange),
            dominantType: (existing.longLiquidated + volumeValue) > existing.shortLiquidated ? 'long' : 'short',
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
            longPositions: 1, // APENAS LONG
            shortPositions: 0, // ZERO SHORT
            totalPositions: 1,
            longLiquidated: volumeValue, // APENAS LONG
            shortLiquidated: 0, // ZERO SHORT
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
        
        // Salvar no Supabase
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

        setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
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

      setProcessedTickers(new Set());
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Filtrar e ordenar assets LONG - APENAS dados LONG
  const filteredLongAssets = useMemo(() => {
    const assetsArray = Array.from(longAssets.values());
    
    const filtered = assetsArray.filter(asset => {
      const isHighCap = asset.marketCap === 'high';
      const minAmount = isHighCap ? 150000 : 40000; // Aumentar thresholds
      const minPositions = isHighCap ? 1 : 1;
      
      // FILTRAR APENAS por valores LONG (não usar combinedTotal)
      return asset.longLiquidated >= minAmount && asset.longPositions >= minPositions;
    });
    
    // Ordenar por valor liquidado LONG especificamente
    const sorted = filtered.sort((a, b) => {
      if (a.longLiquidated !== b.longLiquidated) {
        return b.longLiquidated - a.longLiquidated;
      }
      return b.longPositions - a.longPositions;
    });
    
    console.log(`🔴 LONG ASSETS FILTRADOS: ${sorted.length}`);
    sorted.forEach(asset => {
      console.log(`🔴 ${asset.asset}: $${(asset.longLiquidated/1000).toFixed(0)}K LONG (${asset.longPositions} pos) [Short: $${(asset.shortLiquidated/1000).toFixed(0)}K]`);
    });
    
    return sorted.slice(0, 50);
  }, [longAssets]);

  return {
    longLiquidations: filteredLongAssets,
    longAssets
  };
};
