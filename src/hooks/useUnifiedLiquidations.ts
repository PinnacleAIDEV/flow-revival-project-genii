
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

  // Processar liquidações
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const updatedAssets = new Map(unifiedAssets);

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

    console.log(`🔍 Processando ${uniqueData.length} ativos únicos para liquidações...`);

    if (uniqueData.length === 0) return;

    uniqueData.forEach(data => {
      try {
        const priceChange = data.change_24h || 0;
        const volumeValue = data.volume * data.price;
        const marketCap = getMarketCapCategory(data.ticker);
        const isHighMarketCap = marketCap === 'high';
        
        // Critérios mais flexíveis para detectar liquidações
        const minVolume = isHighMarketCap ? 50000 : 15000; // Reduzido para detectar mais
        const minPriceChange = isHighMarketCap ? 1.5 : 2.0; // Reduzido para detectar mais
        
        const hasSignificantVolume = volumeValue > minVolume;
        const hasSignificantPriceMove = Math.abs(priceChange) > minPriceChange;
        
        if (hasSignificantVolume && hasSignificantPriceMove) {
          // Determinar o tipo de liquidação baseado na direção do preço
          let liquidationType: 'long' | 'short';
          
          if (priceChange < 0) {
            // Preço caindo = Long positions sendo liquidadas
            liquidationType = 'long';
            console.log(`🔴 DETECTADO Long Liquidation: ${data.ticker} (${priceChange.toFixed(2)}% queda)`);
          } else {
            // Preço subindo = Short positions sendo liquidadas
            liquidationType = 'short';
            console.log(`🟢 DETECTADO Short Liquidation: ${data.ticker} (${priceChange.toFixed(2)}% alta)`);
          }
          
          const assetName = data.ticker.replace('USDT', '');
          
          // Calcular intensidade
          const volumeRatio = volumeValue / minVolume;
          const priceRatio = Math.abs(priceChange) / minPriceChange;
          const combinedRatio = (volumeRatio + priceRatio) / 2;
          
          let intensity = 1;
          if (combinedRatio >= 10) intensity = 5;
          else if (combinedRatio >= 5) intensity = 4;
          else if (combinedRatio >= 3) intensity = 3;
          else if (combinedRatio >= 1.5) intensity = 2;
          
          const liquidation = {
            id: `${data.ticker}-${liquidationType}-${now.getTime()}`,
            asset: assetName,
            type: liquidationType,
            amount: volumeValue,
            price: data.price,
            marketCap,
            timestamp: safeCreateDate(data.timestamp),
            intensity,
            change24h: priceChange,
            volume: data.volume,
            lastUpdateTime: now,
            totalLiquidated: volumeValue
          };
          
          const unifiedAsset = createOrUpdateUnifiedAsset(updatedAssets, liquidation);
          updatedAssets.set(assetName, unifiedAsset);
          
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
        setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
      } catch (error) {
        console.error('❌ Erro ao processar liquidação:', error, data);
      }
    });

    // Atualizar assets uma única vez
    setUnifiedAssets(updatedAssets);
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

  // Filtrar liquidações por tipo com critérios mais flexíveis
  const { longLiquidations, shortLiquidations } = useMemo(() => {
    const assetsArray = Array.from(unifiedAssets.values());
    
    console.log(`🔍 FILTRANDO ${assetsArray.length} assets totais...`);
    
    // Filtrar assets com liquidações LONG predominantes
    const longAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      
      // Tem liquidações long significativas
      const hasLongLiquidations = asset.longLiquidated >= filters.minAmount && 
                                  asset.longPositions >= filters.minPositions;
      
      // Long é dominante (pelo menos 60% do total ou não tem short significativo)
      const totalLiquidated = asset.longLiquidated + asset.shortLiquidated;
      const longDominance = totalLiquidated > 0 ? (asset.longLiquidated / totalLiquidated) : 0;
      const isLongDominant = longDominance >= 0.6 || asset.shortLiquidated === 0;
      
      const shouldInclude = hasLongLiquidations && isLongDominant;
      
      if (shouldInclude) {
        console.log(`🔴 LONG ASSET: ${asset.asset} - L:$${(asset.longLiquidated/1000).toFixed(0)}K (${(longDominance*100).toFixed(0)}%), S:$${(asset.shortLiquidated/1000).toFixed(0)}K`);
      }
      
      return shouldInclude;
    });
    
    // Filtrar assets com liquidações SHORT predominantes
    const shortAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      
      // Tem liquidações short significativas
      const hasShortLiquidations = asset.shortLiquidated >= filters.minAmount && 
                                   asset.shortPositions >= filters.minPositions;
      
      // Short é dominante (pelo menos 60% do total ou não tem long significativo)
      const totalLiquidated = asset.longLiquidated + asset.shortLiquidated;
      const shortDominance = totalLiquidated > 0 ? (asset.shortLiquidated / totalLiquidated) : 0;
      const isShortDominant = shortDominance >= 0.6 || asset.longLiquidated === 0;
      
      const shouldInclude = hasShortLiquidations && isShortDominant;
      
      if (shouldInclude) {
        console.log(`🟢 SHORT ASSET: ${asset.asset} - S:$${(asset.shortLiquidated/1000).toFixed(0)}K (${(shortDominance*100).toFixed(0)}%), L:$${(asset.longLiquidated/1000).toFixed(0)}K`);
      }
      
      return shouldInclude;
    });
    
    // Ordenar e limitar
    const sortedLong = sortAssetsByRelevance(longAssets, 'long').slice(0, 50);
    const sortedShort = sortAssetsByRelevance(shortAssets, 'short').slice(0, 50);
    
    console.log(`📊 RESULTADO: ${sortedLong.length} Long Assets / ${sortedShort.length} Short Assets`);
    
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
