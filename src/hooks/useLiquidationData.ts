
import { useState, useEffect } from 'react';
import { LiquidationBubble, getMarketCapCategory, LiquidationStats } from '../types/liquidation';
import { safeCreateDate, calculateDynamicThreshold, calculateIntensity, shouldDetectLiquidation, logLiquidationDetection } from '../utils/liquidationUtils';
import { useRealFlowData } from './useRealFlowData';
import { useSupabaseStorage } from './useSupabaseStorage';
import { usePersistedData } from './usePersistedData';

export const useLiquidationData = () => {
  const { flowData } = useRealFlowData();
  const { saveLiquidation } = useSupabaseStorage();
  
  // Usar dados persistidos
  const { 
    data: persistedLongLiquidations, 
    addData: addLongLiquidations 
  } = usePersistedData<LiquidationBubble>({
    key: 'liquidations_long',
    maxAgeMinutes: 5
  });
  
  const { 
    data: persistedShortLiquidations, 
    addData: addShortLiquidations 
  } = usePersistedData<LiquidationBubble>({
    key: 'liquidations_short',
    maxAgeMinutes: 5
  });

  const [longLiquidations, setLongLiquidations] = useState<LiquidationBubble[]>([]);
  const [shortLiquidations, setShortLiquidations] = useState<LiquidationBubble[]>([]);
  const [processedTickers, setProcessedTickers] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<LiquidationStats>({
    totalLong: 0,
    totalShort: 0,
    highCapLong: 0,
    highCapShort: 0,
    lowCapLong: 0,
    lowCapShort: 0
  });

  // Inicializar com dados persistidos
  useEffect(() => {
    console.log(`📊 Inicializando liquidações com dados persistidos:`);
    console.log(`- Long liquidations: ${persistedLongLiquidations.length}`);
    console.log(`- Short liquidations: ${persistedShortLiquidations.length}`);
    
    setLongLiquidations(persistedLongLiquidations);
    setShortLiquidations(persistedShortLiquidations);
  }, [persistedLongLiquidations, persistedShortLiquidations]);

  // Limpeza automática a cada minuto
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      console.log('🧹 Limpando liquidações antigas...');
      
      setLongLiquidations(prev => {
        const filtered = prev.filter(liq => liq.lastUpdateTime > fifteenMinutesAgo);
        const removed = prev.length - filtered.length;
        if (removed > 0) {
          console.log(`🗑️ Removidas ${removed} liquidações LONG antigas`);
        }
        return filtered;
      });
      
      setShortLiquidations(prev => {
        const filtered = prev.filter(liq => liq.lastUpdateTime > fifteenMinutesAgo);
        const removed = prev.length - filtered.length;
        if (removed > 0) {
          console.log(`🗑️ Removidas ${removed} liquidações SHORT antigas`);
        }
        return filtered;
      });

      setProcessedTickers(new Set());
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Função para balancear liquidações (50% high cap, 50% low cap)
  const balanceLiquidations = (liquidations: LiquidationBubble[]): LiquidationBubble[] => {
    const highCap = liquidations.filter(liq => liq.marketCap === 'high');
    const lowCap = liquidations.filter(liq => liq.marketCap === 'low');
    
    // Ordenar por valor total liquidado
    const sortedHighCap = highCap.sort((a, b) => b.totalLiquidated - a.totalLiquidated);
    const sortedLowCap = lowCap.sort((a, b) => b.totalLiquidated - a.totalLiquidated);
    
    // Pegar até 25 de cada categoria para garantir equilíbrio
    const balancedHighCap = sortedHighCap.slice(0, 25);
    const balancedLowCap = sortedLowCap.slice(0, 25);
    
    return [...balancedHighCap, ...balancedLowCap]
      .sort((a, b) => b.totalLiquidated - a.totalLiquidated)
      .slice(0, 50);
  };

  // Calcular estatísticas
  const updateStats = (longs: LiquidationBubble[], shorts: LiquidationBubble[]) => {
    const newStats: LiquidationStats = {
      totalLong: longs.length,
      totalShort: shorts.length,
      highCapLong: longs.filter(l => l.marketCap === 'high').length,
      highCapShort: shorts.filter(l => l.marketCap === 'high').length,
      lowCapLong: longs.filter(l => l.marketCap === 'low').length,
      lowCapShort: shorts.filter(l => l.marketCap === 'low').length
    };
    
    setStats(newStats);
    
    // Log estatísticas detalhadas
    console.log(`📈 STATS LIQUIDAÇÕES:`, newStats);
    if (newStats.highCapLong === 0 || newStats.highCapShort === 0) {
      console.warn('⚠️ DESEQUILÍBRIO: Faltam liquidações HIGH CAP em algum tipo');
    }
    if (newStats.lowCapLong === 0 || newStats.lowCapShort === 0) {
      console.warn('⚠️ DESEQUILÍBRIO: Faltam liquidações LOW CAP em algum tipo');
    }
  };

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const newLongLiquidations: LiquidationBubble[] = [];
    const newShortLiquidations: LiquidationBubble[] = [];

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

    uniqueData.forEach(data => {
      try {
        const priceChange = data.change_24h || 0;
        const volumeValue = data.volume * data.price;
        const marketCap = getMarketCapCategory(data.ticker);
        const isHighMarketCap = marketCap === 'high';
        
        // NOVA LÓGICA: Thresholds dinâmicos e equalizados
        const threshold = calculateDynamicThreshold(data.ticker, isHighMarketCap, volumeValue);
        const shouldDetect = shouldDetectLiquidation(volumeValue, priceChange, threshold);
        
        // Detectar tipo de liquidação (CORRIGIDO)
        let liquidationType: 'long' | 'short';
        if (priceChange < 0) {
          // Preço caindo = LONGs sendo liquidados
          liquidationType = 'long';
        } else {
          // Preço subindo = SHORTs sendo liquidados  
          liquidationType = 'short';
        }
        
        // Log detalhado da decisão
        logLiquidationDetection(data.ticker, liquidationType, volumeValue, priceChange, threshold, shouldDetect);
        
        if (shouldDetect) {
          const intensity = calculateIntensity(volumeValue, priceChange, threshold);
          
          const liquidation: LiquidationBubble = {
            id: `${data.ticker}-${now.getTime()}`,
            asset: data.ticker.replace('USDT', ''),
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
          
          console.log(`💥 LIQUIDAÇÃO EQUALIZADA: ${liquidation.asset} (${marketCap.toUpperCase()}) - ${liquidation.type.toUpperCase()} - Change: ${priceChange.toFixed(2)}% - ${(liquidation.totalLiquidated / 1000).toFixed(0)}K`);
          
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
          
          if (liquidation.type === 'long') {
            newLongLiquidations.push(liquidation);
          } else {
            newShortLiquidations.push(liquidation);
          }

          setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
        }
      } catch (error) {
        console.error('Erro ao processar dados de liquidação:', error, data);
      }
    });

    // Atualizar liquidações com balanceamento
    if (newLongLiquidations.length > 0) {
      setLongLiquidations(prev => {
        const updated = [...prev];
        
        newLongLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            updated[existingIndex] = { 
              ...newLiq, 
              totalLiquidated: updated[existingIndex].totalLiquidated + newLiq.amount,
              lastUpdateTime: now
            };
          } else {
            updated.push(newLiq);
          }
        });
        
        const balanced = balanceLiquidations(updated);
        addLongLiquidations(newLongLiquidations);
        
        return balanced;
      });
    }
    
    if (newShortLiquidations.length > 0) {
      setShortLiquidations(prev => {
        const updated = [...prev];
        
        newShortLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            updated[existingIndex] = { 
              ...newLiq, 
              totalLiquidated: updated[existingIndex].totalLiquidated + newLiq.amount,
              lastUpdateTime: now
            };
          } else {
            updated.push(newLiq);
          }
        });
        
        const balanced = balanceLiquidations(updated);
        addShortLiquidations(newShortLiquidations);
        
        return balanced;
      });
    }
  }, [flowData, processedTickers, saveLiquidation, addLongLiquidations, addShortLiquidations]);

  // Atualizar stats quando liquidações mudarem
  useEffect(() => {
    updateStats(longLiquidations, shortLiquidations);
  }, [longLiquidations, shortLiquidations]);

  return {
    longLiquidations,
    shortLiquidations,
    stats
  };
};
