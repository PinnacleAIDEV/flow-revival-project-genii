
import { useState, useEffect, useMemo } from 'react';
import { useRealFlowData } from './useRealFlowData';
import { detectLiquidations } from '../utils/liquidationUtils';

interface LiquidationFlowData {
  ticker: string;
  price: number;
  volume: number;
  change_24h: number;
  timestamp: number;
  volumeValue: number;
  marketCap: 'high' | 'low';
}

export const useLiquidationDataDistributor = () => {
  const { flowData } = useRealFlowData();
  const [processedTickers, setProcessedTickers] = useState<Set<string>>(new Set());

  // Lista de ativos com market cap alto
  const highMarketCapAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
    'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT',
    'XLMUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'NEOUSDT', 'ALGOUSDT'
  ];

  // Processar dados em tempo real e distribuir corretamente
  const { longFlowData, shortFlowData, distributionStats } = useMemo(() => {
    const longData: LiquidationFlowData[] = [];
    const shortData: LiquidationFlowData[] = [];
    let totalProcessed = 0;
    let longDetections = 0;
    let shortDetections = 0;
    let bothDetections = 0;

    console.log(`🔄 DISTRIBUINDO ${flowData.length} dados de flow...`);

    flowData.forEach(data => {
      const key = `${data.ticker}-${data.timestamp}`;
      
      // Evitar processamento duplicado no mesmo ciclo
      if (processedTickers.has(key)) return;

      const volumeValue = data.volume * data.price;
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      // Usar função de detecção melhorada
      const detectionResult = detectLiquidations(
        data.ticker,
        volumeValue,
        data.change_24h,
        isHighMarketCap
      );

      const liquidationData: LiquidationFlowData = {
        ticker: data.ticker,
        price: data.price,
        volume: data.volume,
        change_24h: data.change_24h,
        timestamp: data.timestamp,
        volumeValue,
        marketCap: isHighMarketCap ? 'high' : 'low'
      };

      // IMPORTANTE: Cada ativo pode ir para ambas as listas baseado na atividade real
      let added = false;

      if (detectionResult.longLiquidation) {
        longData.push(liquidationData);
        longDetections++;
        added = true;
        console.log(`🔴 LONG LIQUIDATION: ${data.ticker} - Preço: ${data.change_24h.toFixed(2)}% - Vol: $${(volumeValue/1000).toFixed(0)}K`);
      }

      if (detectionResult.shortLiquidation) {
        shortData.push(liquidationData);
        shortDetections++;
        if (added) bothDetections++; // Contador para ativos que apareceram em ambos
        console.log(`🟢 SHORT LIQUIDATION: ${data.ticker} - Preço: ${data.change_24h.toFixed(2)}% - Vol: $${(volumeValue/1000).toFixed(0)}K`);
      }

      if (added) {
        totalProcessed++;
        setProcessedTickers(prev => new Set([...prev, key]));
      }
    });

    console.log(`📊 DISTRIBUIÇÃO CONCLUÍDA:`);
    console.log(`- Total processado: ${totalProcessed}`);
    console.log(`- Long liquidations: ${longDetections}`);
    console.log(`- Short liquidations: ${shortDetections}`);
    console.log(`- Ativos em ambas as listas: ${bothDetections}`);
    console.log(`- Long dados únicos: ${longData.length}`);
    console.log(`- Short dados únicos: ${shortData.length}`);

    return {
      longFlowData: longData,
      shortFlowData: shortData,
      distributionStats: {
        totalProcessed,
        longDetections,
        shortDetections,
        bothDetections,
        longDataLength: longData.length,
        shortDataLength: shortData.length
      }
    };
  }, [flowData, processedTickers]);

  // Limpeza periódica
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 Limpando tickers processados...');
      setProcessedTickers(new Set());
    }, 2 * 60 * 1000); // Limpar a cada 2 minutos

    return () => clearInterval(cleanupInterval);
  }, []);

  // Log de debug detalhado
  useEffect(() => {
    if (distributionStats.totalProcessed > 0) {
      console.log(`🎯 STATS ATUALIZADAS:`, distributionStats);
      
      // Verificar se há overlap (normal, ativos podem ter ambos os tipos)
      if (distributionStats.bothDetections > 0) {
        console.log(`ℹ️ ${distributionStats.bothDetections} ativos detectados com AMBOS os tipos de liquidação (comportamento normal)`);
      }
    }
  }, [distributionStats]);

  return {
    longFlowData,
    shortFlowData,
    distributionStats,
    hasData: longFlowData.length > 0 || shortFlowData.length > 0
  };
};
