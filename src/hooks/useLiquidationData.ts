
import { useState, useEffect } from 'react';
import { LiquidationBubble, getMarketCapCategory, LiquidationStats } from '../types/liquidation';
import { 
  safeCreateDate, 
  formatAmount, 
  detectLiquidations,
  calculateRelevanceScore,
  logFilteringDecision,
  analyzeBalance,
  updateLiquidationWithTimeLimit
} from '../utils/liquidationUtils';
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

  // NOVA: Função de priorização por relevância atual (substitui balanceLiquidations)
  const prioritizeLiquidationsByRelevance = (liquidations: LiquidationBubble[]): LiquidationBubble[] => {
    const highCap = liquidations.filter(liq => liq.marketCap === 'high');
    const lowCap = liquidations.filter(liq => liq.marketCap === 'low');
    
    console.log(`🎯 PRIORIZANDO POR RELEVÂNCIA:`);
    console.log(`- High Cap total: ${highCap.length} liquidações`);
    console.log(`- Low Cap total: ${lowCap.length} liquidações`);
    
    // NOVA ORDENAÇÃO: Por relevância atual (não totalLiquidated)
    const sortedHighCap = highCap
      .map(liq => ({ liq, score: calculateRelevanceScore(liq) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
    
    const sortedLowCap = lowCap
      .map(liq => ({ liq, score: calculateRelevanceScore(liq) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
    
    // Log decisões de filtro
    [...sortedHighCap, ...sortedLowCap].forEach(({ liq, score }, index) => {
      logFilteringDecision(liq, score, index < 50, index < 50 ? 'TOP_50' : 'FILTERED_OUT');
    });
    
    // Mesclar e ordenar final por relevância
    const finalResult = [...sortedHighCap.map(s => s.liq), ...sortedLowCap.map(s => s.liq)]
      .sort((a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a))
      .slice(0, 50);
    
    console.log(`🏆 RESULTADO FINAL: ${finalResult.length} liquidações selecionadas por relevância`);
    console.log(`- High Cap selecionadas: ${finalResult.filter(l => l.marketCap === 'high').length}`);
    console.log(`- Low Cap selecionadas: ${finalResult.filter(l => l.marketCap === 'low').length}`);
    
    return finalResult;
  };

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
    
    // Análise de balanceamento por relevância atual
    analyzeBalance(longs, shorts);
    
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
            amount: volumeValue, // VALOR ATUAL da liquidação
            price: data.price,
            marketCap,
            timestamp: safeCreateDate(data.timestamp),
            intensity: detection.longLiquidation.intensity,
            change24h: priceChange,
            volume: data.volume,
            lastUpdateTime: now,
            totalLiquidated: volumeValue // Inicialmente igual ao amount
          };
          
          console.log(`🔴 LONG LIQUIDATION: ${liquidation.asset} (${marketCap.toUpperCase()}) - Fall: ${priceChange.toFixed(2)}% - Current: ${formatAmount(liquidation.amount)} - Score: ${calculateRelevanceScore(liquidation).toFixed(1)}`);
          
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
          
          newLongLiquidations.push(liquidation);
        }
        
        // Processar Short Liquidation se detectada
        if (detection.shortLiquidation) {
          const liquidation: LiquidationBubble = {
            id: `${data.ticker}-short-${now.getTime()}`,
            asset: data.ticker.replace('USDT', ''),
            type: 'short',
            amount: volumeValue, // VALOR ATUAL da liquidação
            price: data.price,
            marketCap,
            timestamp: safeCreateDate(data.timestamp),
            intensity: detection.shortLiquidation.intensity,
            change24h: priceChange,
            volume: data.volume,
            lastUpdateTime: now,
            totalLiquidated: volumeValue // Inicialmente igual ao amount
          };
          
          console.log(`🟢 SHORT LIQUIDATION: ${liquidation.asset} (${marketCap.toUpperCase()}) - Rise: ${priceChange.toFixed(2)}% - Current: ${formatAmount(liquidation.amount)} - Score: ${calculateRelevanceScore(liquidation).toFixed(1)}`);
          
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

    // Atualizar liquidações com NOVA LÓGICA de relevância
    if (newLongLiquidations.length > 0) {
      setLongLiquidations(prev => {
        const updated = [...prev];
        
        newLongLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // NOVA: Usar janela deslizante para acumulação
            updated[existingIndex] = updateLiquidationWithTimeLimit(updated[existingIndex], newLiq.amount);
          } else {
            updated.push(newLiq);
          }
        });
        
        // NOVA: Priorizar por relevância ao invés de totalLiquidated
        const prioritized = prioritizeLiquidationsByRelevance(updated);
        addLongLiquidations(newLongLiquidations);
        
        return prioritized;
      });
    }
    
    if (newShortLiquidations.length > 0) {
      setShortLiquidations(prev => {
        const updated = [...prev];
        
        newShortLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // NOVA: Usar janela deslizante para acumulação
            updated[existingIndex] = updateLiquidationWithTimeLimit(updated[existingIndex], newLiq.amount);
          } else {
            updated.push(newLiq);
          }
        });
        
        // NOVA: Priorizar por relevância ao invés de totalLiquidated
        const prioritized = prioritizeLiquidationsByRelevance(updated);
        addShortLiquidations(newShortLiquidations);
        
        return prioritized;
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
