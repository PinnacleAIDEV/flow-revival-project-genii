
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

  // CORRIGIDO: Processar liquidações sem dependência circular
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();

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

    if (uniqueData.length === 0) return;

    uniqueData.forEach(data => {
      try {
        const priceChange = data.change_24h || 0;
        const volumeValue = data.volume * data.price;
        const marketCap = getMarketCapCategory(data.ticker);
        const isHighMarketCap = marketCap === 'high';
        
        console.log(`📊 ANALISANDO ${data.ticker}: Price=${priceChange.toFixed(2)}%, Vol=${(volumeValue/1000).toFixed(0)}K`);
        
        // Detectar liquidações usando lógica corrigida
        const detection = detectLiquidations(data.ticker, volumeValue, priceChange, isHighMarketCap);
        
        // Processar APENAS se detectou long liquidation (sem short)
        if (detection.longLiquidation && !detection.shortLiquidation) {
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
          
          console.log(`🔴 PROCESSANDO LONG: ${assetName} - ${(volumeValue/1e6).toFixed(2)}M`);
          
          // Atualizar assets de forma isolada
          setUnifiedAssets(prevAssets => {
            const updatedAssets = new Map(prevAssets);
            const unifiedAsset = createOrUpdateUnifiedAsset(updatedAssets, liquidation);
            updatedAssets.set(assetName, unifiedAsset);
            return updatedAssets;
          });
          
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
        
        // Processar APENAS se detectou short liquidation (sem long)
        if (detection.shortLiquidation && !detection.longLiquidation) {
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
          
          console.log(`🟢 PROCESSANDO SHORT: ${assetName} - ${(volumeValue/1e6).toFixed(2)}M`);
          
          // Atualizar assets de forma isolada
          setUnifiedAssets(prevAssets => {
            const updatedAssets = new Map(prevAssets);
            const unifiedAsset = createOrUpdateUnifiedAsset(updatedAssets, liquidation);
            updatedAssets.set(assetName, unifiedAsset);
            return updatedAssets;
          });
          
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

        // Log se não detectou nada
        if (!detection.longLiquidation && !detection.shortLiquidation) {
          console.log(`⚪ SEM LIQUIDAÇÃO: ${data.ticker} - Price=${priceChange.toFixed(2)}%, Vol=${(volumeValue/1000).toFixed(0)}K`);
        }

        // Marcar como processado
        setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
      } catch (error) {
        console.error('❌ Erro ao processar liquidação unificada:', error, data);
      }
    });
  }, [flowData, saveLiquidation]); // REMOVIDO unifiedAssets da dependência

  // Detectar trend reversals
  useEffect(() => {
    if (unifiedAssets.size > 0) {
      const reversals = detectTrendReversals(unifiedAssets);
      setTrendReversals(reversals);
      
      if (reversals.length > 0) {
        console.log(`🔄 Detectadas ${reversals.length} reversões de tendência`);
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

  // CORRIGIDO: Filtragem mais rigorosa e separada
  const { longLiquidations, shortLiquidations } = useMemo(() => {
    const assetsArray = Array.from(unifiedAssets.values());
    
    console.log(`🔍 FILTRANDO ${assetsArray.length} assets totais...`);
    
    // FILTRO RIGOROSO: Assets que têm APENAS liquidações long (shortLiquidated deve ser 0)
    const pureHongAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      const hasSignificantLong = asset.longLiquidated >= filters.minAmount && 
                                 asset.longPositions >= filters.minPositions &&
                                 asset.intensity >= filters.minIntensity;
      
      // CRUCIAL: Deve ter long E não ter short
      const isPureLong = asset.longLiquidated > 0 && asset.shortLiquidated === 0;
      
      const include = hasSignificantLong && isPureLong;
      
      console.log(`🔴 FILTRO LONG ${asset.asset}: L=${(asset.longLiquidated/1000).toFixed(0)}K, S=${(asset.shortLiquidated/1000).toFixed(0)}K, Pure=${isPureLong}, Include=${include}`);
      
      return include;
    });
    
    // FILTRO RIGOROSO: Assets que têm APENAS liquidações short (longLiquidated deve ser 0)
    const pureShortAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      const hasSignificantShort = asset.shortLiquidated >= filters.minAmount && 
                                  asset.shortPositions >= filters.minPositions &&
                                  asset.intensity >= filters.minIntensity;
      
      // CRUCIAL: Deve ter short E não ter long
      const isPureShort = asset.shortLiquidated > 0 && asset.longLiquidated === 0;
      
      const include = hasSignificantShort && isPureShort;
      
      console.log(`🟢 FILTRO SHORT ${asset.asset}: L=${(asset.longLiquidated/1000).toFixed(0)}K, S=${(asset.shortLiquidated/1000).toFixed(0)}K, Pure=${isPureShort}, Include=${include}`);
      
      return include;
    });
    
    // Ordenar e limitar
    const sortedLong = sortAssetsByRelevance(pureHongAssets, 'long').slice(0, 50);
    const sortedShort = sortAssetsByRelevance(pureShortAssets, 'short').slice(0, 50);
    
    console.log(`📊 RESULTADO FINAL: ${sortedLong.length} Long Puros / ${sortedShort.length} Short Puros`);
    
    // Debug dos primeiros assets de cada lista
    if (sortedLong.length > 0) {
      console.log(`🔴 TOP 3 LONG:`, sortedLong.slice(0, 3).map(a => `${a.asset}(${(a.longLiquidated/1000).toFixed(0)}K)`));
    }
    if (sortedShort.length > 0) {
      console.log(`🟢 TOP 3 SHORT:`, sortedShort.slice(0, 3).map(a => `${a.asset}(${(a.shortLiquidated/1000).toFixed(0)}K)`));
    }
    
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
