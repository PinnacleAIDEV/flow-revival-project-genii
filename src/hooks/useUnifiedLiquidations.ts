
import { useState, useEffect, useMemo } from 'react';
import { UnifiedLiquidationAsset, TrendReversal, getMarketCapCategory } from '../types/liquidation';
import { 
  detectLiquidations,
  safeCreateDate 
} from '../utils/liquidationUtils';
import {
  createOrUpdateUnifiedAsset,
  getAdaptiveFilters,
  sortAssetsByRelevance,
  detectTrendReversals,
  cleanOldAssets
} from '../utils/unifiedLiquidationUtils';
import { useRealFlowData } from './useRealFlowData';
import { useSupabaseStorage } from './useSupabaseStorage';

export const useUnifiedLiquidations = () => {
  const { flowData } = useRealFlowData();
  const { saveLiquidation } = useSupabaseStorage();
  
  const [unifiedAssets, setUnifiedAssets] = useState<Map<string, UnifiedLiquidationAsset>>(new Map());
  const [trendReversals, setTrendReversals] = useState<TrendReversal[]>([]);
  const [processedTickers, setProcessedTickers] = useState<Set<string>>(new Set());

  // CORRIGIDO: Processar dados de flow com lógica mais clara
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const newUpdates = new Map<string, UnifiedLiquidationAsset>();

    // Processar apenas dados únicos e válidos
    const uniqueData = flowData.filter((data, index, self) => {
      const key = `${data.ticker}-${data.timestamp}`;
      return (
        data.ticker && 
        !isNaN(data.price) && 
        data.price > 0 &&
        !isNaN(data.volume) && 
        data.volume > 0 &&
        data.change_24h !== undefined &&
        !processedTickers.has(key) &&
        index === self.findIndex(d => d.ticker === data.ticker)
      );
    });

    console.log(`🔍 Processando ${uniqueData.length} ativos únicos para liquidações unificadas...`);

    uniqueData.forEach(data => {
      try {
        const priceChange = data.change_24h || 0;
        const volumeValue = data.volume * data.price;
        const marketCap = getMarketCapCategory(data.ticker);
        const isHighMarketCap = marketCap === 'high';
        
        // CRUCIAL: Debug de cada ativo
        console.log(`📊 ANALISANDO ${data.ticker}: Price=${priceChange.toFixed(2)}%, Vol=${(volumeValue/1000).toFixed(0)}K`);
        
        // Detectar liquidações usando lógica corrigida
        const detection = detectLiquidations(data.ticker, volumeValue, priceChange, isHighMarketCap);
        
        // CORRIGIDO: Processar liquidações detectadas de forma independente
        if (detection.longLiquidation) {
          const assetName = data.ticker.replace('USDT', '');
          
          const liquidation = {
            id: `${data.ticker}-long-${now.getTime()}`,
            asset: assetName,
            type: 'long' as const,
            amount: volumeValue,
            price: data.price,
            marketCap,
            timestamp: safeCreateDate(data.timestamp),
            intensity: detection.longLiquidation.intensity,
            change24h: priceChange,
            volume: data.volume,
            lastUpdateTime: now,
            totalLiquidated: volumeValue
          };
          
          const unifiedAsset = createOrUpdateUnifiedAsset(unifiedAssets, liquidation);
          newUpdates.set(assetName, unifiedAsset);
          
          console.log(`🔴 LONG LIQUIDATION CONFIRMADA: ${assetName} - ${(volumeValue/1e6).toFixed(2)}M - Preço caiu ${priceChange.toFixed(2)}%`);
          
          saveLiquidation({
            asset: liquidation.asset,
            ticker: data.ticker,
            type: liquidation.type,
            amount: liquidation.amount,
            price: liquidation.price,
            market_cap: liquidation.marketCap,
            intensity: liquidation.intensity,
            change_24h: liquidation.change24h,
            volume: liquidation.volume,
            total_liquidated: liquidation.totalLiquidated,
            volume_spike: 1
          });
        }
        
        if (detection.shortLiquidation) {
          const assetName = data.ticker.replace('USDT', '');
          
          const liquidation = {
            id: `${data.ticker}-short-${now.getTime()}`,
            asset: assetName,
            type: 'short' as const,
            amount: volumeValue,
            price: data.price,
            marketCap,
            timestamp: safeCreateDate(data.timestamp),
            intensity: detection.shortLiquidation.intensity,
            change24h: priceChange,
            volume: data.volume,
            lastUpdateTime: now,
            totalLiquidated: volumeValue
          };
          
          // IMPORTANTE: Usar o asset correto (pode já existir com LONG)
          const existingAsset = newUpdates.get(assetName) || unifiedAssets.get(assetName);
          const unifiedAsset = createOrUpdateUnifiedAsset(existingAsset || {} as any, liquidation);
          newUpdates.set(assetName, unifiedAsset);
          
          console.log(`🟢 SHORT LIQUIDATION CONFIRMADA: ${assetName} - ${(volumeValue/1e6).toFixed(2)}M - Preço subiu ${priceChange.toFixed(2)}%`);
          
          saveLiquidation({
            asset: liquidation.asset,
            ticker: data.ticker,
            type: liquidation.type,
            amount: liquidation.amount,
            price: liquidation.price,
            market_cap: liquidation.marketCap,
            intensity: liquidation.intensity,
            change_24h: liquidation.change24h,
            volume: liquidation.volume,
            total_liquidated: liquidation.totalLiquidated,
            volume_spike: 1
          });
        }

        // Se não detectou nada, log para debug
        if (!detection.longLiquidation && !detection.shortLiquidation) {
          console.log(`⚪ SEM LIQUIDAÇÃO: ${data.ticker} - Price=${priceChange.toFixed(2)}%, Vol=${(volumeValue/1000).toFixed(0)}K`);
        }

        // Marcar como processado
        setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
      } catch (error) {
        console.error('❌ Erro ao processar liquidação unificada:', error, data);
      }
    });

    // CORRIGIDO: Atualizar assets unificados
    if (newUpdates.size > 0) {
      console.log(`📈 ATUALIZANDO ${newUpdates.size} assets com novas liquidações`);
      
      setUnifiedAssets(prev => {
        const updated = new Map(prev);
        newUpdates.forEach((asset, key) => {
          updated.set(key, asset);
        });
        return updated;
      });
    }
  }, [flowData, processedTickers, saveLiquidation, unifiedAssets]);

  // Detectar trend reversals
  useEffect(() => {
    if (unifiedAssets.size > 0) {
      const reversals = detectTrendReversals(unifiedAssets);
      setTrendReversals(reversals);
      
      if (reversals.length > 0) {
        console.log(`🔄 Detectadas ${reversals.length} reversões de tendência:`);
        reversals.slice(0, 3).forEach(r => {
          console.log(`   - ${r.asset}: ${r.previousType.toUpperCase()} → ${r.currentType.toUpperCase()} (${r.reversalRatio.toFixed(2)}x)`);
        });
      }
    }
  }, [unifiedAssets]);

  // Limpeza automática
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Limpando assets antigos...');
      
      setUnifiedAssets(prev => {
        const cleaned = cleanOldAssets(prev, 15);
        const removed = prev.size - cleaned.size;
        if (removed > 0) {
          console.log(`🗑️ Removidos ${removed} assets antigos`);
        }
        return cleaned;
      });

      setProcessedTickers(new Set());
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Computar listas filtradas
  const { longLiquidations, shortLiquidations } = useMemo(() => {
    const assetsArray = Array.from(unifiedAssets.values());
    
    // Filtrar assets com liquidações long
    const longAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      return asset.longLiquidated >= filters.minAmount && 
             asset.longPositions >= filters.minPositions &&
             asset.intensity >= filters.minIntensity;
    });
    
    // Filtrar assets com liquidações short  
    const shortAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      return asset.shortLiquidated >= filters.minAmount && 
             asset.shortPositions >= filters.minPositions &&
             asset.intensity >= filters.minIntensity;
    });
    
    // Ordenar e limitar
    const sortedLong = sortAssetsByRelevance(longAssets, 'long').slice(0, 50);
    const sortedShort = sortAssetsByRelevance(shortAssets, 'short').slice(0, 50);
    
    console.log(`📊 LISTAS FILTRADAS: ${sortedLong.length} Long / ${sortedShort.length} Short liquidations`);
    
    return {
      longLiquidations: sortedLong,
      shortLiquidations: sortedShort
    };
  }, [unifiedAssets]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      totalLong: longLiquidations.length,
      totalShort: shortLiquidations.length,
      highCapLong: longLiquidations.filter(a => a.marketCap === 'high').length,
      highCapShort: shortLiquidations.filter(a => a.marketCap === 'high').length,
      lowCapLong: longLiquidations.filter(a => a.marketCap === 'low').length,
      lowCapShort: shortLiquidations.filter(a => a.marketCap === 'low').length
    };
  }, [longLiquidations, shortLiquidations]);

  return {
    longLiquidations,
    shortLiquidations,
    trendReversals,
    stats,
    unifiedAssets
  };
};
