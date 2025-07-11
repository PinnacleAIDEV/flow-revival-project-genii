
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

  const handleRealLiquidation = useCallback((data: FlowData) => {
    // APENAS dados REAIS do Force Order
    if (data.isLiquidation && data.liquidationType && data.liquidationAmount) {
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      const realLiquidation: RealLiquidationData = {
        ticker: data.ticker,
        asset: data.ticker.replace('USDT', ''),
        type: data.liquidationType === 'LONG' ? 'long' : 'short',
        amount: data.liquidationAmount,
        price: data.price,
        timestamp: data.timestamp,
        marketCap: isHighMarketCap ? 'high' : 'low',
        intensity: Math.min(10, Math.floor(data.liquidationAmount / 25000)),
        isReal: true,
        source: 'FORCE_ORDER'
      };

      console.log(`🔥 REAL LIQUIDATION PROCESSED: ${realLiquidation.asset} ${realLiquidation.type.toUpperCase()} $${(realLiquidation.amount/1000).toFixed(1)}K`);
      
      setRealLiquidations(prev => {
        const newLiquidations = [realLiquidation, ...prev.slice(0, 199)];
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
      
      console.log('✅ Successfully connected to REAL professional liquidation data');
      
    } catch (error) {
      console.error('❌ Failed to connect to professional liquidation data:', error);
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
