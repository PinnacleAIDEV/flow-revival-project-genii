
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

  // Processar liquidações de forma otimizada
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const processedTickers = new Set<string>();

    // Filtrar dados únicos e válidos
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

    if (uniqueData.length === 0) return;

    // Objeto temporário para agrupar todas as atualizações
    const updatedAssetsMap = new Map<string, UnifiedLiquidationAsset>();

    uniqueData.forEach(data => {
      try {
        const priceChange = data.change_24h || 0;
        const volumeValue = data.volume * data.price;
        const marketCap = getMarketCapCategory(data.ticker);
        const isHighMarketCap = marketCap === 'high';
        
        // Detectar liquidações
        const detection = detectLiquidations(data.ticker, volumeValue, priceChange, isHighMarketCap);
        const assetName = data.ticker.replace('USDT', '');
        
        // Processar APENAS se detectou long liquidation
        if (detection.longLiquidation && !detection.shortLiquidation) {
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
          
          // Atualizar no mapa temporário
          const currentAssets = updatedAssetsMap.size > 0 ? updatedAssetsMap : unifiedAssets;
          const existingAsset = currentAssets.get(assetName);
          const updatedAsset = createOrUpdateUnifiedAsset(
            existingAsset ? new Map([[assetName, existingAsset]]) : new Map(), 
            liquidation
          );
          updatedAssetsMap.set(assetName, updatedAsset);
          
          // Salvar no Supabase
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
        
        // Processar APENAS se detectou short liquidation
        if (detection.shortLiquidation && !detection.longLiquidation) {
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
          
          // Atualizar no mapa temporário
          const currentAssets = updatedAssetsMap.size > 0 ? updatedAssetsMap : unifiedAssets;
          const existingAsset = currentAssets.get(assetName);
          const updatedAsset = createOrUpdateUnifiedAsset(
            existingAsset ? new Map([[assetName, existingAsset]]) : new Map(), 
            liquidation
          );
          updatedAssetsMap.set(assetName, updatedAsset);
          
          // Salvar no Supabase
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

        // Marcar como processado
        processedTickers.add(`${data.ticker}-${data.timestamp}`);
      } catch (error) {
        console.error('❌ Erro ao processar liquidação:', error);
      }
    });

    // ÚNICA atualização do estado se houver mudanças
    if (updatedAssetsMap.size > 0) {
      setUnifiedAssets(prevAssets => {
        const newAssets = new Map(prevAssets);
        updatedAssetsMap.forEach((asset, key) => {
          newAssets.set(key, asset);
        });
        return newAssets;
      });
    }
  }, [flowData, saveLiquidation]);

  // Detectar trend reversals
  useEffect(() => {
    if (unifiedAssets.size > 0) {
      const reversals = detectTrendReversals(unifiedAssets);
      setTrendReversals(reversals);
    }
  }, [unifiedAssets]);

  // Limpeza automática
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setUnifiedAssets(prev => {
        const cleaned = cleanOldAssets(prev, 15);
        return cleaned;
      });
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Filtragem rigorosa e corrigida
  const { longLiquidations, shortLiquidations } = useMemo(() => {
    const assetsArray = Array.from(unifiedAssets.values());
    
    // FILTRO RIGOROSO: Assets com APENAS liquidações long (shortLiquidated deve ser 0)
    const pureLongAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      const hasSignificantLong = asset.longLiquidated >= filters.minAmount && 
                                 asset.longPositions >= filters.minPositions &&
                                 asset.intensity >= filters.minIntensity;
      
      // CRUCIAL: Deve ter long E não ter short
      const isPureLong = asset.longLiquidated > 0 && asset.shortLiquidated === 0;
      
      return hasSignificantLong && isPureLong;
    });
    
    // FILTRO RIGOROSO: Assets com APENAS liquidações short (longLiquidated deve ser 0)
    const pureShortAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      const hasSignificantShort = asset.shortLiquidated >= filters.minAmount && 
                                  asset.shortPositions >= filters.minPositions &&
                                  asset.intensity >= filters.minIntensity;
      
      // CRUCIAL: Deve ter short E não ter long
      const isPureShort = asset.shortLiquidated > 0 && asset.longLiquidated === 0;
      
      return hasSignificantShort && isPureShort;
    });
    
    // Ordenar e limitar
    const sortedLong = sortAssetsByRelevance(pureLongAssets, 'long').slice(0, 50);
    const sortedShort = sortAssetsByRelevance(pureShortAssets, 'short').slice(0, 50);
    
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
