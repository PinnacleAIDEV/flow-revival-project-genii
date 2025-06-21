import { useState, useEffect, useMemo } from 'react';
import { UnifiedLiquidationAsset, getMarketCapCategory } from '../types/liquidation';
import { safeCreateDate } from '../utils/liquidationUtils';
import { useRealFlowData } from './useRealFlowData';
import { useSupabaseStorage } from './useSupabaseStorage';

export const useShortLiquidations = () => {
  const { flowData } = useRealFlowData();
  const { saveLiquidation } = useSupabaseStorage();
  
  const [shortAssets, setShortAssets] = useState<Map<string, UnifiedLiquidationAsset>>(new Map());
  const [processedTickers, setProcessedTickers] = useState<Set<string>>(new Set());

  // Processar dados de liquidação SHORT reais - APENAS ALTAS
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(shortAssets);

    // CRUCIAL: Filtrar RIGOROSAMENTE apenas liquidações SHORT (altas significativas)
    const shortLiquidationData = flowData.filter((data, index, self) => {
      const key = `${data.ticker}-${data.timestamp}`;
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const isHighMarketCap = marketCap === 'high';
      const priceChange = data.change_24h || 0;
      
      // LIQUIDAÇÃO SHORT: Apenas em ALTAS FORTES (valores positivos significativos)
      const minVolume = isHighMarketCap ? 75000 : 25000;
      const minPriceChange = isHighMarketCap ? 2.0 : 3.0; // ALTAS mínimas
      
      const isValidTicker = data.ticker && !isNaN(data.price) && data.price > 0;
      const isValidVolume = !isNaN(data.volume) && data.volume > 0;
      const hasValidPriceChange = !isNaN(priceChange);
      const isNotProcessed = !processedTickers.has(key);
      const isUniqueInBatch = index === self.findIndex(d => d.ticker === data.ticker);
      const hasMinVolume = volumeValue > minVolume;
      const isSignificantRise = priceChange >= minPriceChange; // SÓ ALTAS
      
      // Debug para entender filtros
      if (data.ticker === 'BTCUSDT' || data.ticker === 'ETHUSDT') {
        console.log(`🟢 SHORT FILTER ${data.ticker}: Price=${priceChange.toFixed(2)}% (need >=${minPriceChange}), Vol=$${(volumeValue/1000).toFixed(0)}K (need >${(minVolume/1000).toFixed(0)}K), Pass=${isSignificantRise && hasMinVolume}`);
      }
      
      return (
        isValidTicker &&
        isValidVolume &&
        hasValidPriceChange &&
        isNotProcessed &&
        isUniqueInBatch &&
        hasMinVolume &&
        isSignificantRise // CRUCIAL: SÓ ALTAS
      );
    });

    console.log(`🟢 PROCESSANDO ${shortLiquidationData.length} SHORT liquidations (apenas altas significativas)...`);

    // Processar apenas as liquidações short válidas
    shortLiquidationData.forEach(data => {
      try {
        const priceChange = data.change_24h || 0;
        const volumeValue = data.volume * data.price;
        const marketCap = getMarketCapCategory(data.ticker);
        const assetName = data.ticker.replace('USDT', '');
        
        // Calcular intensidade baseada na alta
        const isHighMarketCap = marketCap === 'high';
        const minVolume = isHighMarketCap ? 75000 : 25000;
        const priceRiseRatio = priceChange / (isHighMarketCap ? 2.0 : 3.0);
        const volumeRatio = volumeValue / minVolume;
        const combinedRatio = (priceRiseRatio + volumeRatio) / 2;
        
        let intensity = 1;
        if (combinedRatio >= 5) intensity = 5;
        else if (combinedRatio >= 3) intensity = 4;
        else if (combinedRatio >= 2) intensity = 3;
        else if (combinedRatio >= 1.5) intensity = 2;
        
        console.log(`🟢 SHORT LIQUIDATION: ${data.ticker} - Alta: ${priceChange.toFixed(2)}% - Vol: $${(volumeValue/1000).toFixed(0)}K - Intensity: ${intensity}`);
        
        // Criar/atualizar asset SHORT com dados separados
        const existing = updatedAssets.get(assetName);
        if (existing) {
          const updated: UnifiedLiquidationAsset = {
            ...existing,
            price: data.price,
            shortPositions: existing.shortPositions + 1, // INCREMENTAR APENAS SHORT
            shortLiquidated: existing.shortLiquidated + volumeValue, // INCREMENTAR APENAS SHORT
            totalPositions: existing.longPositions + (existing.shortPositions + 1), // RECALCULAR
            combinedTotal: existing.longLiquidated + (existing.shortLiquidated + volumeValue), // RECALCULAR
            lastUpdateTime: now,
            intensity: Math.max(existing.intensity, intensity),
            volatility: Math.abs(priceChange),
            dominantType: existing.longLiquidated > (existing.shortLiquidated + volumeValue) ? 'long' : 'short',
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
            longPositions: 0, // ZERO LONG
            shortPositions: 1, // APENAS SHORT
            totalPositions: 1,
            longLiquidated: 0, // ZERO LONG
            shortLiquidated: volumeValue, // APENAS SHORT
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
        
        // Salvar no Supabase
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

        setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
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

      setProcessedTickers(new Set());
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Filtrar e ordenar assets SHORT - APENAS dados SHORT
  const filteredShortAssets = useMemo(() => {
    const assetsArray = Array.from(shortAssets.values());
    
    const filtered = assetsArray.filter(asset => {
      const isHighCap = asset.marketCap === 'high';
      const minAmount = isHighCap ? 150000 : 40000; // Aumentar thresholds
      const minPositions = isHighCap ? 1 : 1;
      
      // FILTRAR APENAS por valores SHORT (não usar combinedTotal)
      return asset.shortLiquidated >= minAmount && asset.shortPositions >= minPositions;
    });
    
    // Ordenar por valor liquidado SHORT especificamente
    const sorted = filtered.sort((a, b) => {
      if (a.shortLiquidated !== b.shortLiquidated) {
        return b.shortLiquidated - a.shortLiquidated;
      }
      return b.shortPositions - a.shortPositions;
    });
    
    console.log(`🟢 SHORT ASSETS FILTRADOS: ${sorted.length}`);
    sorted.forEach(asset => {
      console.log(`🟢 ${asset.asset}: $${(asset.shortLiquidated/1000).toFixed(0)}K SHORT (${asset.shortPositions} pos) [Long: $${(asset.longLiquidated/1000).toFixed(0)}K]`);
    });
    
    return sorted.slice(0, 50);
  }, [shortAssets]);

  return {
    shortLiquidations: filteredShortAssets,
    shortAssets
  };
};
