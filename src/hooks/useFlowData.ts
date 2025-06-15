import { useState, useEffect, useCallback } from 'react';
import { webSocketService, FlowData, Alert } from '../services/WebSocketService';
import { flowAnalytics } from '../services/FlowAnalytics';
import { alertSystem } from '../services/AlertSystem';

export const useFlowData = () => {
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
    console.log('📈 Processing flow data:', data.ticker, data.price);
    
    // Atualizar dados de flow
    setFlowData(prev => {
      const updated = [data, ...prev.filter(item => item.ticker !== data.ticker)].slice(0, 100);
      
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
      console.log('🚀 Initiating connection to Digital Ocean droplet (157.245.240.29)...');
      
      // Testar conexão primeiro
      const isHealthy = await webSocketService.testConnection();
      if (!isHealthy) {
        console.warn('⚠️ HTTP health check failed, trying WebSocket connection directly...');
      }
      
      await webSocketService.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      
      webSocketService.onMessage(handleFlowData);
      
      console.log('✅ Successfully connected to Pinnacle AI Pro Flow System');
      
      // Configurar keepalive
      const keepAliveInterval = setInterval(() => {
        if (webSocketService.isConnected()) {
          webSocketService.sendPing();
        } else {
          clearInterval(keepAliveInterval);
        }
      }, 30000); // Ping a cada 30 segundos
      
    } catch (error) {
      console.error('❌ Failed to connect to Digital Ocean droplet:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
      
      // Mostrar erro detalhado
      if (errorMessage.includes('insecure WebSocket')) {
        setConnectionError('Erro de segurança: Tentando conexão WSS (porta 8443) ou configure HTTPS no droplet');
      } else if (errorMessage.includes('timeout')) {
        setConnectionError('Timeout: Verifique se o droplet está rodando e acessível');
      } else {
        setConnectionError(`Falha na conexão: ${errorMessage}`);
      }
    }
  }, [handleFlowData]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
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
    getAlertsByType,
    clearAlerts,
    reconnect,
    disconnect
  };
};
