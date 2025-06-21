
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
  // NOVOS CAMPOS PARA LIQUIDAÇÕES REAIS
  isRealLiquidation: boolean;
  liquidationAmount?: number;
  liquidationIntensity: number;
  source: 'FORCE_ORDER' | 'PRICE_ANALYSIS';
}

export const useLiquidationDataDistributor = () => {
  const { flowData } = useRealFlowData();
  const [longFlowData, setLongFlowData] = useState<LiquidationFlowData[]>([]);
  const [shortFlowData, setShortFlowData] = useState<LiquidationFlowData[]>([]);

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const longData: LiquidationFlowData[] = [];
    const shortData: LiquidationFlowData[] = [];

    console.log(`🔍 Processando ${flowData.length} dados para liquidações REAIS...`);

    flowData.forEach(data => {
      const volumeValue = data.volume * data.price;
      const marketCap = getMarketCapCategory(data.ticker);
      const priceChange = data.change_24h || 0;
      
      // NOVA LÓGICA: Priorizar Force Orders (liquidações REAIS)
      if (data.isLiquidation && data.liquidationType && data.liquidationAmount) {
        // LIQUIDAÇÃO REAL DETECTADA via Force Order
        const realLiquidation: LiquidationFlowData = {
          ticker: data.ticker,
          price: data.price,
          volume: data.volume,
          change_24h: priceChange,
          timestamp: data.timestamp,
          marketCap,
          volumeValue: data.liquidationAmount,
          type: data.liquidationType === 'LONG' ? 'long' : 'short',
          isRealLiquidation: true,
          liquidationAmount: data.liquidationAmount,
          liquidationIntensity: Math.min(10, Math.floor(data.liquidationAmount / 50000)), // Intensidade baseada no valor
          source: 'FORCE_ORDER'
        };

        if (data.liquidationType === 'LONG') {
          longData.push(realLiquidation);
          console.log(`🔴 REAL LONG LIQUIDATION: ${data.ticker} - $${(data.liquidationAmount/1000).toFixed(1)}K`);
        } else {
          shortData.push(realLiquidation);
          console.log(`🟢 REAL SHORT LIQUIDATION: ${data.ticker} - $${(data.liquidationAmount/1000).toFixed(1)}K`);
        }
      } else {
        // ANÁLISE SECUNDÁRIA: Detectar possíveis liquidações por preço/volume (backup)
        const minVolume = marketCap === 'high' ? 100000 : 35000;
        
        if (volumeValue > minVolume) {
          // Critérios mais rigorosos para análise secundária
          let liquidationType: 'long' | 'short' | null = null;
          let intensity = 1;
          
          if (priceChange <= -5 && volumeValue > minVolume * 2) {
            // Queda forte + volume alto = possível long liquidation
            liquidationType = 'long';
            intensity = Math.min(8, Math.floor(Math.abs(priceChange) / 2));
          } else if (priceChange >= 5 && volumeValue > minVolume * 2) {
            // Subida forte + volume alto = possível short liquidation
            liquidationType = 'short';
            intensity = Math.min(8, Math.floor(priceChange / 2));
          }
          
          if (liquidationType) {
            const analysisLiquidation: LiquidationFlowData = {
              ticker: data.ticker,
              price: data.price,
              volume: data.volume,
              change_24h: priceChange,
              timestamp: data.timestamp,
              marketCap,
              volumeValue,
              type: liquidationType,
              isRealLiquidation: false,
              liquidationIntensity: intensity,
              source: 'PRICE_ANALYSIS'
            };
            
            if (liquidationType === 'long') {
              longData.push(analysisLiquidation);
              console.log(`🔸 POSSIBLE LONG LIQ: ${data.ticker} - ${priceChange.toFixed(1)}% - $${(volumeValue/1000).toFixed(0)}K`);
            } else {
              shortData.push(analysisLiquidation);
              console.log(`🔹 POSSIBLE SHORT LIQ: ${data.ticker} - ${priceChange.toFixed(1)}% - $${(volumeValue/1000).toFixed(0)}K`);
            }
          }
        }
      }
    });

    // Ordenar por relevância: Force Orders primeiro, depois por valor
    const sortByRelevance = (a: LiquidationFlowData, b: LiquidationFlowData) => {
      if (a.isRealLiquidation && !b.isRealLiquidation) return -1;
      if (!a.isRealLiquidation && b.isRealLiquidation) return 1;
      return b.volumeValue - a.volumeValue;
    };

    longData.sort(sortByRelevance);
    shortData.sort(sortByRelevance);

    console.log(`🔴 LONG LIQUIDATIONS: ${longData.length} (${longData.filter(l => l.isRealLiquidation).length} reais)`);
    console.log(`🟢 SHORT LIQUIDATIONS: ${shortData.length} (${shortData.filter(l => l.isRealLiquidation).length} reais)`);
    
    setLongFlowData(longData.slice(0, 50)); // Limitar a 50 mais relevantes
    setShortFlowData(shortData.slice(0, 50));
  }, [flowData]);

  return {
    longFlowData,
    shortFlowData,
    realLiquidationsCount: {
      long: longFlowData.filter(l => l.isRealLiquidation).length,
      short: shortFlowData.filter(l => l.isRealLiquidation).length
    }
  };
};
