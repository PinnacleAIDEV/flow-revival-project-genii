
import { useState, useEffect } from 'react';
import { LiquidationBubble, highMarketCapAssets } from '../types/liquidation';
import { safeCreateDate } from '../utils/liquidationUtils';
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

      // Limpar tickers processados também
      setProcessedTickers(new Set());
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

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
        index === self.findIndex(d => d.ticker === data.ticker) // Pegar apenas o mais recente de cada ticker
      );
    });

    uniqueData.forEach(data => {
      try {
        const priceChange = Math.abs(data.change_24h || 0);
        const volumeValue = data.volume * data.price;
        const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
        
        // LÓGICA CORRIGIDA: Melhor detecção de liquidações
        const threshold = isHighMarketCap ? 
          { volume: 50000, priceChange: 1.5 } :   // High cap: $50k + 1.5%
          { volume: 15000, priceChange: 2.0 };     // Low cap: $15k + 2.0%
        
        // Detectar liquidação com volume e volatilidade
        if (volumeValue > threshold.volume && priceChange > threshold.priceChange) {
          // LÓGICA CORRIGIDA: Inversão da lógica de long/short
          // Se preço está CAINDO (change negativo), LONGS são liquidados
          // Se preço está SUBINDO (change positivo), SHORTS são liquidados
          const liquidationType: 'long' | 'short' = (data.change_24h || 0) < 0 ? 'long' : 'short';
          
          // Calcular intensidade baseada nos dados
          const volumeRatio = volumeValue / threshold.volume;
          const priceRatio = priceChange / threshold.priceChange;
          const combinedRatio = (volumeRatio + priceRatio) / 2;
          
          let intensity = 1;
          if (combinedRatio >= 10) intensity = 5;
          else if (combinedRatio >= 6) intensity = 4;
          else if (combinedRatio >= 3.5) intensity = 3;
          else if (combinedRatio >= 2) intensity = 2;
          else intensity = 1;
          
          const liquidation: LiquidationBubble = {
            id: `${data.ticker}-${now.getTime()}`,
            asset: data.ticker.replace('USDT', ''),
            type: liquidationType,
            amount: volumeValue,
            price: data.price,
            marketCap: isHighMarketCap ? 'high' : 'low',
            timestamp: safeCreateDate(data.timestamp),
            intensity,
            change24h: data.change_24h || 0,
            volume: data.volume,
            lastUpdateTime: now,
            totalLiquidated: volumeValue
          };
          
          console.log(`💥 LIQUIDAÇÃO CORRIGIDA: ${liquidation.asset} - ${liquidation.type.toUpperCase()} - Change: ${data.change_24h?.toFixed(2)}% - ${(liquidation.totalLiquidated / 1000).toFixed(0)}K`);
          
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

          // Marcar como processado
          setProcessedTickers(prev => new Set([...prev, `${data.ticker}-${data.timestamp}`]));
        }
      } catch (error) {
        console.error('Erro ao processar dados de liquidação:', error, data);
      }
    });

    // Atualizar liquidações acumulando valores e persistir
    if (newLongLiquidations.length > 0) {
      setLongLiquidations(prev => {
        const updated = [...prev];
        
        newLongLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // Acumular valor total
            updated[existingIndex] = { 
              ...newLiq, 
              totalLiquidated: updated[existingIndex].totalLiquidated + newLiq.amount,
              lastUpdateTime: now
            };
          } else {
            updated.push(newLiq);
          }
        });
        
        // Ordenar por maior valor liquidado total
        const sorted = updated
          .sort((a, b) => b.totalLiquidated - a.totalLiquidated)
          .slice(0, 50); // Limitar a 50 para performance
        
        // Persistir novos dados
        addLongLiquidations(newLongLiquidations);
        
        return sorted;
      });
    }
    
    if (newShortLiquidations.length > 0) {
      setShortLiquidations(prev => {
        const updated = [...prev];
        
        newShortLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // Acumular valor total
            updated[existingIndex] = { 
              ...newLiq, 
              totalLiquidated: updated[existingIndex].totalLiquidated + newLiq.amount,
              lastUpdateTime: now
            };
          } else {
            updated.push(newLiq);
          }
        });
        
        // Ordenar por maior valor liquidado total
        const sorted = updated
          .sort((a, b) => b.totalLiquidated - a.totalLiquidated)
          .slice(0, 50); // Limitar a 50 para performance
        
        // Persistir novos dados
        addShortLiquidations(newShortLiquidations);
        
        return sorted;
      });
    }
  }, [flowData, processedTickers, saveLiquidation, addLongLiquidations, addShortLiquidations]);

  return {
    longLiquidations,
    shortLiquidations
  };
};
