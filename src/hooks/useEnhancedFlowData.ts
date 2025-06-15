
import { useState, useEffect, useCallback } from 'react';
import { enhancedWebSocketService, FlowData, Alert } from '../services/EnhancedWebSocketService';
import { flowAnalytics } from '../services/FlowAnalytics';
import { alertSystem } from '../services/AlertSystem';

export const useEnhancedFlowData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flowData, setFlowData] = useState<FlowData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [marketSentiment, setMarketSentiment] = useState({
    score: 0,
    interpretation: 'Neutral' as string,
    bullish_count: 0,
    bearish_count: 0,
    neutral_count: 0
  });

  const handleFlowData = useCallback((data: FlowData) => {
    console.log('📈 Processing flow data:', data.ticker, data.price.toFixed(4));
    
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
      setConnectionError(null);
      setConnectionStatus('connecting');
      console.log('🚀 Initiating Enhanced Market Data Connection...');
      
      await enhancedWebSocketService.connect();
      
      const status = enhancedWebSocketService.getConnectionStatus();
      setIsConnected(true);
      setConnectionStatus('connected');
      setIsSimulatorMode(status.isSimulator);
      
      enhancedWebSocketService.onMessage(handleFlowData);
      
      if (status.isSimulator) {
        console.log('✅ Successfully connected via Market Data Simulator');
      } else {
        console.log('✅ Successfully connected to real market data');
      }
      
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
    }
  }, [handleFlowData]);

  const disconnect = useCallback(() => {
    enhancedWebSocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectionError(null);
    setIsSimulatorMode(false);
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
    isSimulatorMode,
    getAlertsByType,
    clearAlerts,
    reconnect,
    disconnect
  };
};
