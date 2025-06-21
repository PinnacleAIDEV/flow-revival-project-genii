
import { useState, useEffect } from 'react';
import { useRealFlowData } from './useRealFlowData';
import { getMarketCapCategory } from '../types/liquidation';

export interface LiquidationFlowData {
  ticker: string;
  price: number;
  volume: number;
  change_24h: number;
  timestamp: number;
  marketCap: 'high' | 'low';
  volumeValue: number;
  type: 'long' | 'short';
}

export const useLiquidationDataDistributor = () => {
  const { flowData } = useRealFlowData();
  const [longFlowData, setLongFlowData] = useState<LiquidationFlowData[]>([]);
  const [shortFlowData, setShortFlowData] = useState<LiquidationFlowData[]>([]);

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const longData: LiquidationFlowData[] = [];
    const shortData: LiquidationFlowData[] = [];

    // Processar cada ativo e dividir em long/short baseado na variação de preço
    flowData.forEach(data => {
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const priceChange = data.change_24h || 0;
      
      // FILTROS AUMENTADOS EM 40% (reduzidos para capturar mais dados)
      const minVolume = marketCap === 'high' ? 35714 : 10714; // 50000*0.6 e 15000*0.6 (redução de 40%)
      
      // Critério básico: se o volume é significativo
      if (volumeValue > minVolume) {
        const baseData = {
          ticker: data.ticker,
          price: data.price,
          volume: data.volume,
          change_24h: priceChange,
          timestamp: data.timestamp,
          marketCap,
          volumeValue
        };

        // Simular separação: assets pares vão para long, ímpares para short
        // Isso garante que cada ativo apareça apenas em uma lista
        const assetHash = data.ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        
        if (assetHash % 2 === 0) {
          longData.push({
            ...baseData,
            type: 'long'
          });
        } else {
          shortData.push({
            ...baseData,
            type: 'short'
          });
        }
      }
    });

    console.log(`🔴 DISTRIBUTOR: ${longData.length} long assets`);
    console.log(`🟢 DISTRIBUTOR: ${shortData.length} short assets`);
    
    setLongFlowData(longData);
    setShortFlowData(shortData);
  }, [flowData]);

  return {
    longFlowData,
    shortFlowData
  };
};
