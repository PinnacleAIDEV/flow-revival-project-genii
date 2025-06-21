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
        
        // CORRIGIDO: Detectar liquidações baseado na direção do preço
        // LONG liquidations = preço CAINDO (negativo)
        // SHORT liquidations = preço SUBINDO (positivo)
        
        let shouldCreateLiquidation = false;
        let liquidationType: 'long' | 'short' = 'long';
        
        // Critérios de volume mínimo
        const minVolume = isHighMarketCap ? 100000 : 25000;
        const minPriceChange = isHighMarketCap ? 2 : 3;
        
        if (volumeValue > minVolume && Math.abs(priceChange) > minPriceChange) {
          shouldCreateLiquidation = true;
          
          // CRUCIAL: Determinar tipo baseado na DIREÇÃO do preço
          if (priceChange < 0) {
            // Preço caindo = LONG positions sendo liquidadas
            liquidationType = 'long';
            console.log(`🔴 LONG LIQUIDATION detectada: ${data.ticker} (${priceChange.toFixed(2)}% queda)`);
          } else {
            // Preço subindo = SHORT positions sendo liquidadas  
            liquidationType = 'short';
            console.log(`🟢 SHORT LIQUIDATION detectada: ${data.ticker} (${priceChange.toFixed(2)}% alta)`);
          }
        }
        
        if (shouldCreateLiquidation) {
          const assetName = data.ticker.replace('USDT', '');
          
          // Calcular intensidade baseada no volume e mudança de preço
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

  // CORRIGIDO: Filtragem rigorosa para separar Long e Short corretamente
  const { longLiquidations, shortLiquidations } = useMemo(() => {
    const assetsArray = Array.from(unifiedAssets.values());
    
    console.log(`🔍 FILTRANDO ${assetsArray.length} assets totais...`);
    
    // Assets que têm PREDOMINANTEMENTE liquidações LONG
    const pureLongAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      const hasSignificantLong = asset.longLiquidated >= filters.minAmount && 
                                 asset.longPositions >= filters.minPositions &&
                                 asset.intensity >= filters.minIntensity;
      
      // Asset é considerado LONG se:
      // 1. Tem liquidações long significativas E
      // 2. (Não tem short OU long é pelo menos 2x maior que short)
      const isLongDominant = asset.longLiquidated > 0 && 
                             (asset.shortLiquidated === 0 || asset.longLiquidated >= asset.shortLiquidated * 2);
      
      const shouldInclude = hasSignificantLong && isLongDominant;
      
      if (shouldInclude) {
        console.log(`🔴 LONG DOMINANTE: ${asset.asset} - Long: $${(asset.longLiquidated/1000).toFixed(0)}K, Short: $${(asset.shortLiquidated/1000).toFixed(0)}K`);
      }
      
      return shouldInclude;
    });
    
    // Assets que têm PREDOMINANTEMENTE liquidações SHORT
    const pureShortAssets = assetsArray.filter(asset => {
      const filters = getAdaptiveFilters(asset.marketCap);
      const hasSignificantShort = asset.shortLiquidated >= filters.minAmount && 
                                  asset.shortPositions >= filters.minPositions &&
                                  asset.intensity >= filters.minIntensity;
      
      // Asset é considerado SHORT se:
      // 1. Tem liquidações short significativas E
      // 2. (Não tem long OU short é pelo menos 2x maior que long)
      const isShortDominant = asset.shortLiquidated > 0 && 
                              (asset.longLiquidated === 0 || asset.shortLiquidated >= asset.longLiquidated * 2);
      
      const shouldInclude = hasSignificantShort && isShortDominant;
      
      if (shouldInclude) {
        console.log(`🟢 SHORT DOMINANTE: ${asset.asset} - Long: $${(asset.longLiquidated/1000).toFixed(0)}K, Short: $${(asset.shortLiquidated/1000).toFixed(0)}K`);
      }
      
      return shouldInclude;
    });
    
    // Ordenar e limitar
    const sortedLong = sortAssetsByRelevance(pureLongAssets, 'long').slice(0, 50);
    const sortedShort = sortAssetsByRelevance(pureShortAssets, 'short').slice(0, 50);
    
    console.log(`📊 RESULTADO FINAL: ${sortedLong.length} Long Dominantes / ${sortedShort.length} Short Dominantes`);
    
    // Debug dos primeiros assets
    if (sortedLong.length > 0) {
      console.log(`🔴 TOP 3 LONG:`, sortedLong.slice(0, 3).map(a => `${a.asset}(L:${(a.longLiquidated/1000).toFixed(0)}K|S:${(a.shortLiquidated/1000).toFixed(0)}K)`));
    }
    if (sortedShort.length > 0) {
      console.log(`🟢 TOP 3 SHORT:`, sortedShort.slice(0, 3).map(a => `${a.asset}(L:${(a.longLiquidated/1000).toFixed(0)}K|S:${(a.shortLiquidated/1000).toFixed(0)}K)`));
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
    stats: {
      totalLong: longLiquidations.length,
      totalShort: shortLiquidations.length,
      highCapLong: longLiquidations.filter(a => a.marketCap === 'high').length,
      highCapShort: shortLiquidations.filter(a => a.marketCap === 'high').length,
      lowCapLong: longLiquidations.filter(a => a.marketCap === 'low').length,
      lowCapShort: shortLiquidations.filter(a => a.marketCap === 'low').length
    },
    unifiedAssets
  };
};
