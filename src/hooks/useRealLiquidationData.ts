
import { useState, useEffect, useCallback } from 'react';
import { binanceWebSocketService, FlowData } from '../services/BinanceWebSocketService';

export interface RealLiquidationData {
  ticker: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  timestamp: number;
  marketCap: 'high' | 'low';
  intensity: number;
  isReal: true;
  source: 'FORCE_ORDER';
}

export const useRealLiquidationData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [realLiquidations, setRealLiquidations] = useState<RealLiquidationData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const highMarketCapAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
    'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'LTCUSDT', 'BCHUSDT'
  ];

  // FILTROS SIMPLES - Apenas valor mínimo
  const MINIMUM_LIQUIDATION_THRESHOLD = {
    HIGH_CAP: 30000,  // $30K para high cap
    LOW_CAP: 15000,   // $15K para low cap
  };

  const handleRealLiquidation = useCallback((data: FlowData) => {
    // Apenas dados REAIS do Force Order
    if (data.isLiquidation && data.liquidationType && data.liquidationAmount) {
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      // FILTRO SIMPLES: Apenas valor mínimo
      const minThreshold = isHighMarketCap ? 
        MINIMUM_LIQUIDATION_THRESHOLD.HIGH_CAP : 
        MINIMUM_LIQUIDATION_THRESHOLD.LOW_CAP;
      
      if (data.liquidationAmount < minThreshold) {
        console.log(`🚫 FILTERED: ${data.ticker} - $${(data.liquidationAmount/1000).toFixed(1)}K (below ${minThreshold/1000}K)`);
        return;
      }
      
      const realLiquidation: RealLiquidationData = {
        ticker: data.ticker,
        asset: data.ticker.replace('USDT', ''),
        type: data.liquidationType === 'LONG' ? 'long' : 'short',
        amount: data.liquidationAmount,
        price: data.price,
        timestamp: data.timestamp,
        marketCap: isHighMarketCap ? 'high' : 'low',
        intensity: Math.min(10, Math.floor(data.liquidationAmount / 10000)),
        isReal: true,
        source: 'FORCE_ORDER'
      };

      console.log(`🔥 LIQUIDATION APPROVED: ${realLiquidation.asset} ${realLiquidation.type.toUpperCase()} $${(realLiquidation.amount/1000).toFixed(1)}K`);
      
      setRealLiquidations(prev => {
        const newLiquidations = [realLiquidation, ...prev.slice(0, 499)];
        return newLiquidations;
      });
    }
  }, []);

  const connectToRealData = useCallback(async () => {
    try {
      setConnectionError(null);
      setConnectionStatus('connecting');
      console.log('🚀 Connecting to REAL Force Order liquidation data...');
      
      await binanceWebSocketService.connect();
      
      setIsConnected(true);
      setConnectionStatus('connected');
      
      binanceWebSocketService.onMessage(handleRealLiquidation);
      
      console.log('✅ Connected to REAL liquidation data with SIMPLE filters');
      
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
    }
  }, [handleRealLiquidation]);

  const disconnect = useCallback(() => {
    binanceWebSocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectionError(null);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connectToRealData();
    }, 1000);
  }, [connectToRealData, disconnect]);

  useEffect(() => {
    connectToRealData();
    
    return () => {
      disconnect();
    };
  }, [connectToRealData, disconnect]);

  // Separar liquidações por tipo
  const longLiquidations = realLiquidations.filter(l => l.type === 'long');
  const shortLiquidations = realLiquidations.filter(l => l.type === 'short');

  return {
    isConnected,
    connectionError,
    connectionStatus,
    realLiquidations,
    longLiquidations,
    shortLiquidations,
    reconnect,
    disconnect,
    isRealData: true,
    professionalData: true
  };
};
