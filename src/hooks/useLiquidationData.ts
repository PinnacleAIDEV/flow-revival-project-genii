
import { useState, useEffect } from 'react';
import { LiquidationBubble, getMarketCapCategory, LiquidationStats } from '../types/liquidation';
import { safeCreateDate, formatAmount, detectLiquidations } from '../utils/liquidationUtils';
import { useRealFlowData } from './useRealFlowData';
import { useSupabaseStorage } from './useSupabaseStorage';
import { usePersistedData } from './usePersistedData';

// Interface para callback de dados 24h
interface Use24hLiquidationCallback {
  addLiquidationToDaily: (liquidation: LiquidationBubble) => void;
}

export const useLiquidationData = (dailyCallback?: Use24hLiquidationCallback) => {
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

  // NOVA FUNÇÃO: Calcular relevância atual (baseada em activity atual, não acumulada)
  const calculateCurrentRelevance = (liquidation: LiquidationBubble): number => {
    const now = new Date();
    const ageMinutes = (now.getTime() - liquidation.lastUpdateTime.getTime()) / (1000 * 60);
    
    // Decay temporal - liquidações mais recentes têm mais relevância
    const timeDecay = Math.max(0, 1 - (ageMinutes / 15)); // Decay total em 15 minutos
    
    // Score baseado em intensidade atual + volume atual + recência
    const intensityScore = liquidation.intensity * 20; // 0-100
    const volumeScore = Math.min(liquidation.amount / 100000, 10) * 10; // Até 100
    const recencyScore = timeDecay * 50; // Até 50
    
    return intensityScore + volumeScore + recencyScore;
  };

  // NOVA FUNÇÃO: Filtrar por relevância atual em vez de total acumulado
  const filterByCurrentRelevance = (liquidations: LiquidationBubble[]): LiquidationBubble[] => {
    // Calcular relevância e ordenar
    const withRelevance = liquidations.map(liq => ({
      ...liq,
      currentRelevance: calculateCurrentRelevance(liq)
    }));
    
    // Ordenar por: 1. Relevância atual, 2. Intensidade, 3. Recência
    withRelevance.sort((a, b) => {
      if (b.currentRelevance !== a.currentRelevance) {
        return b.currentRelevance - a.currentRelevance;
      }
      if (b.intensity !== a.intensity) {
        return b.intensity - a.intensity;
      }
      return b.lastUpdateTime.getTime() - a.lastUpdateTime.getTime();
    });
    
    // Balanceamento: garantir mix entre high/low cap
    const highCap = withRelevance.filter(liq => liq.marketCap === 'high').slice(0, 25);
    const lowCap = withRelevance.filter(liq => liq.marketCap === 'low').slice(0, 25);
    
    const balanced = [...highCap, ...lowCap];
    
    // Re-ordenar o mix balanceado por relevância
    balanced.sort((a, b) => b.currentRelevance - a.currentRelevance);
    
    console.log(`🔍 Filtro de relevância aplicado: ${liquidations.length} -> ${balanced.slice(0, 50).length}`);
    console.log(`📊 Balance: ${highCap.length} high cap, ${lowCap.length} low cap`);
    
    return balanced.slice(0, 50);
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
        
        // NOVA LÓGICA: Detecção espelhada usando funções específicas
        const detection = detectLiquidations(data.ticker, volumeValue, priceChange, isHighMarketCap);
        
        // Processar Long Liquidation se detectada
        if (detection.longLiquidation) {
          const liquidation: LiquidationBubble = {
            id: `${data.ticker}-long-${now.getTime()}`,
            asset: data.ticker.replace('USDT', ''),
            type: 'long',
            amount: volumeValue, // MANTIDO: amount = liquidação atual
            price: data.price,
            marketCap,
            timestamp: safeCreateDate(data.timestamp),
            intensity: detection.longLiquidation.intensity,
            change24h: priceChange,
            volume: data.volume,
            lastUpdateTime: now,
            totalLiquidated: volumeValue // MANTIDO: para compatibilidade com componentes existentes
          };
          
          console.log(`🔴 LONG LIQUIDATION: ${liquidation.asset} (${marketCap.toUpperCase()}) - Fall: ${priceChange.toFixed(2)}% - ${formatAmount(liquidation.amount)}`);
          
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
          
          // Adicionar aos totais 24h se callback disponível
          if (dailyCallback?.addLiquidationToDaily) {
            dailyCallback.addLiquidationToDaily(liquidation);
          }
          
          newLongLiquidations.push(liquidation);
        }
        
        // Processar Short Liquidation se detectada
        if (detection.shortLiquidation) {
          const liquidation: LiquidationBubble = {
            id: `${data.ticker}-short-${now.getTime()}`,
            asset: data.ticker.replace('USDT', ''),
            type: 'short',
            amount: volumeValue, // MANTIDO: amount = liquidação atual
            price: data.price,
            marketCap,
            timestamp: safeCreateDate(data.timestamp),
            intensity: detection.shortLiquidation.intensity,
            change24h: priceChange,
            volume: data.volume,
            lastUpdateTime: now,
            totalLiquidated: volumeValue // MANTIDO: para compatibilidade com componentes existentes
          };
          
          console.log(`🟢 SHORT LIQUIDATION: ${liquidation.asset} (${marketCap.toUpperCase()}) - Rise: ${priceChange.toFixed(2)}% - ${formatAmount(liquidation.amount)}`);
          
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
          
          // Adicionar aos totais 24h se callback disponível
          if (dailyCallback?.addLiquidationToDaily) {
            dailyCallback.addLiquidationToDaily(liquidation);
          }
          
          newShortLiquidations.push(liquidation);
        }

        // Marcar como processado se alguma liquidação foi detectada
        if (detection.longLiquidation || detection.shortLiquidation) {
          setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
        }
      } catch (error) {
        console.error('Erro ao processar dados de liquidação:', error, data);
      }
    });

    // Atualizar liquidações com NOVO SISTEMA DE FILTRO por relevância atual
    if (newLongLiquidations.length > 0) {
      setLongLiquidations(prev => {
        const updated = [...prev];
        
        newLongLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // MUDANÇA: Não acumular mais no amount - manter amount atual
            updated[existingIndex] = { 
              ...newLiq, // Substituir completamente com dados atuais
              lastUpdateTime: now
            };
          } else {
            updated.push(newLiq);
          }
        });
        
        // NOVO FILTRO: Usar relevância atual em vez de totalLiquidated
        const filtered = filterByCurrentRelevance(updated);
        addLongLiquidations(newLongLiquidations);
        
        return filtered;
      });
    }
    
    if (newShortLiquidations.length > 0) {
      setShortLiquidations(prev => {
        const updated = [...prev];
        
        newShortLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // MUDANÇA: Não acumular mais no amount - manter amount atual
            updated[existingIndex] = { 
              ...newLiq, // Substituir completamente com dados atuais
              lastUpdateTime: now
            };
          } else {
            updated.push(newLiq);
          }
        });
        
        // NOVO FILTRO: Usar relevância atual em vez de totalLiquidated
        const filtered = filterByCurrentRelevance(updated);
        addShortLiquidations(newShortLiquidations);
        
        return filtered;
      });
    }
  }, [flowData, processedTickers, saveLiquidation, addLongLiquidations, addShortLiquidations, dailyCallback]);

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
