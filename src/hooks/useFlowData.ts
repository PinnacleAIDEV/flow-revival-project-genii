
import { useState, useEffect, useCallback } from 'react';
import { webSocketService, FlowData, Alert } from '../services/WebSocketService';
import { flowAnalytics } from '../services/FlowAnalytics';
import { alertSystem } from '../services/AlertSystem';

export const useFlowData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
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
      console.log('🚀 Initiating connection to Digital Ocean droplet...');
      
      // Testar conexão primeiro
      const isHealthy = await webSocketService.testConnection();
      if (!isHealthy) {
        console.warn('⚠️ Health check failed, but proceeding with WebSocket connection...');
      }
      
      await webSocketService.connect();
      setIsConnected(true);
      
      webSocketService.onMessage(handleFlowData);
      
      console.log('✅ Successfully connected to Pinnacle AI Pro Flow System');
      console.log('🔗 Droplet IP: 157.245.240.29');
      
    } catch (error) {
      console.error('❌ Failed to connect to Digital Ocean droplet:', error);
      setIsConnected(false);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      
      // Mostrar erro específico para o usuário
      alert(`❌ Falha na conexão com o droplet da Digital Ocean (157.245.240.29):\n${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nVerifique se:\n1. O droplet está rodando\n2. O WebSocket está ativo na porta 8080\n3. O firewall permite conexões`);
    }
  }, [handleFlowData]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
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
    alerts,
    flowData,
    marketSentiment,
    getAlertsByType,
    clearAlerts,
    reconnect,
    disconnect
  };
};
