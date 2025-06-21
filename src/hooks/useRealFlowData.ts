import { useState, useEffect, useCallback } from 'react';
import { binanceWebSocketService, FlowData, Alert } from '../services/BinanceWebSocketService';
import { flowAnalytics } from '../services/FlowAnalytics';
import { alertSystem } from '../services/AlertSystem';

export const useRealFlowData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flowData, setFlowData] = useState<FlowData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [marketSentiment, setMarketSentiment] = useState({
    score: 0,
    interpretation: 'Neutral' as string,
    bullish_count: 0,
    bearish_count: 0,
    neutral_count: 0
  });

  const handleFlowData = useCallback((data: FlowData) => {
    // NOVA LÓGICA: Distinguir entre dados de liquidação e dados de preço
    if (data.isLiquidation && data.liquidationType) {
      console.log(`🔥 REAL LIQUIDATION RECEIVED:`, {
        ticker: data.ticker,
        type: data.liquidationType,
        amount: data.liquidationAmount,
        price: data.liquidationPrice,
        timestamp: new Date(data.liquidationTime || data.timestamp).toLocaleTimeString()
      });
    } else {
      console.log(`📊 PRICE DATA:`, {
        ticker: data.ticker,
        price: data.price,
        change24h: data.change_24h?.toFixed(2) + '%',
        volume: (data.volume * data.price / 1000).toFixed(0) + 'K'
      });
    }
    
    // Atualizar dados de flow
    setFlowData(prev => {
      const updated = [data, ...prev.filter(item => 
        // Manter apenas dados únicos por ticker, mas permitir tanto liquidações quanto dados de preço
        !(item.ticker === data.ticker && item.isLiquidation === data.isLiquidation)
      )].slice(0, 200);
      
      // Calcular sentimento apenas com dados de preço (não liquidações)
      const priceData = updated.filter(d => !d.isLiquidation);
      const sentiment = flowAnalytics.calculateMarketSentiment(priceData);
      setMarketSentiment(sentiment);
      
      return updated;
    });

    // Analisar dados para alertas (apenas dados de preço)
    if (!data.isLiquidation) {
      const newAlerts = flowAnalytics.analyzeFlowData(data);
      
      newAlerts.forEach(alert => {
        alertSystem.sendAlert(alert);
        setAlerts(prev => [alert, ...prev].slice(0, 100));
      });
    }
  }, []);

  const connectToFlow = useCallback(async () => {
    try {
      setConnectionError(null);
      setConnectionStatus('connecting');
      console.log('🚀 Connecting to REAL Binance Force Order + Price data...');
      
      await binanceWebSocketService.connect();
      
      setIsConnected(true);
      setConnectionStatus('connected');
      
      binanceWebSocketService.onMessage(handleFlowData);
      
      console.log('✅ Successfully connected to REAL liquidation streams');
      
    } catch (error) {
      console.error('❌ Failed to connect to Binance:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
    }
  }, [handleFlowData]);

  const disconnect = useCallback(() => {
    binanceWebSocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectionError(null);
  }, []);

  const getAlertsByType = useCallback((type: string) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    alertSystem.clearHistory();
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connectToFlow();
    }, 1000);
  }, [connectToFlow, disconnect]);

  useEffect(() => {
    connectToFlow();
    
    return () => {
      disconnect();
    };
  }, [connectToFlow, disconnect]);

  return {
    isConnected,
    connectionError,
    connectionStatus,
    alerts,
    flowData,
    marketSentiment,
    isSimulatorMode: false,
    getAlertsByType,
    clearAlerts,
    reconnect,
    disconnect
  };
};
