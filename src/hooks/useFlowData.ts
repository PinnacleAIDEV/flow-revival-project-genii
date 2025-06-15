
import { useState, useEffect, useCallback } from 'react';
import { webSocketService, FlowData, Alert } from '../services/WebSocketService';
import { flowAnalytics } from '../services/FlowAnalytics';
import { alertSystem } from '../services/AlertSystem';

export const useFlowData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flowData, setFlowData] = useState<FlowData[]>([]);
  const [marketSentiment, setMarketSentiment] = useState({
    score: 0,
    interpretation: 'Neutral' as string,
    bullish_count: 0,
    bearish_count: 0,
    neutral_count: 0
  });

  const handleFlowData = useCallback((data: FlowData) => {
    // Atualizar dados de flow
    setFlowData(prev => {
      const updated = [data, ...prev.filter(item => item.ticker !== data.ticker)].slice(0, 50);
      
      // Calcular sentimento do mercado
      const sentiment = flowAnalytics.calculateMarketSentiment(updated);
      setMarketSentiment(sentiment);
      
      return updated;
    });

    // Analisar dados para alertas
    const newAlerts = flowAnalytics.analyzeFlowData(data);
    
    // Processar cada alerta
    newAlerts.forEach(alert => {
      alertSystem.sendAlert(alert);
      setAlerts(prev => [alert, ...prev].slice(0, 100));
    });
  }, []);

  const connectToFlow = useCallback(async () => {
    try {
      await webSocketService.connect();
      setIsConnected(true);
      
      webSocketService.onMessage(handleFlowData);
      
      console.log('✅ Connected to Pinnacle AI Pro Flow System');
    } catch (error) {
      console.error('❌ Failed to connect to flow system:', error);
      setIsConnected(false);
      
      // Simular dados para desenvolvimento
      simulateFlowData();
    }
  }, [handleFlowData]);

  const simulateFlowData = useCallback(() => {
    const tickers = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT', 'AVAX/USDT'];
    
    const interval = setInterval(() => {
      const ticker = tickers[Math.floor(Math.random() * tickers.length)];
      const basePrice = ticker === 'BTC/USDT' ? 45000 : 
                       ticker === 'ETH/USDT' ? 2800 : 
                       ticker === 'BNB/USDT' ? 335 : 
                       ticker === 'SOL/USDT' ? 125 : 50;

      const mockData: FlowData = {
        ticker,
        price: basePrice + (Math.random() - 0.5) * basePrice * 0.1,
        volume: Math.random() * 1000000 + 100000,
        timestamp: Date.now(),
        exchange: 'Binance',
        bid: basePrice * 0.999,
        ask: basePrice * 1.001,
        change_24h: (Math.random() - 0.5) * 10,
        volume_24h: Math.random() * 50000000 + 10000000,
        vwap: basePrice * (0.99 + Math.random() * 0.02),
        trades_count: Math.floor(Math.random() * 10000) + 1000
      };

      handleFlowData(mockData);
    }, 2000);

    return () => clearInterval(interval);
  }, [handleFlowData]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
  }, []);

  const getAlertsByType = useCallback((type: string) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    alertSystem.clearHistory();
  }, []);

  useEffect(() => {
    connectToFlow();
    
    return () => {
      disconnect();
    };
  }, [connectToFlow, disconnect]);

  return {
    isConnected,
    alerts,
    flowData,
    marketSentiment,
    getAlertsByType,
    clearAlerts,
    reconnect: connectToFlow,
    disconnect
  };
};
