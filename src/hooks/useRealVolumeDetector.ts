import { useState, useEffect, useCallback } from 'react';
import { realKlineVolumeService, VolumeAlert } from '../services/RealKlineVolumeService';

export const useRealVolumeDetector = () => {
  const [alerts, setAlerts] = useState<VolumeAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  // Conectar ao serviço
  useEffect(() => {
    const connect = async () => {
      try {
        await realKlineVolumeService.connect();
        setIsConnected(true);
        setConnectionStatus('connected');
        
        const status = realKlineVolumeService.getConnectionStatus();
        setConnectionInfo(status);
        
        console.log('✅ REAL VOLUME DETECTOR connected:', status);
      } catch (error) {
        console.error('❌ Failed to connect real volume detector:', error);
        setIsConnected(false);
        setConnectionStatus('error');
      }
    };

    connect();

    // Cleanup
    return () => {
      realKlineVolumeService.disconnect();
    };
  }, []);

  // Handler para novos alertas
  const handleVolumeAlert = useCallback((alert: VolumeAlert) => {
    setAlerts(prev => {
      // Anti-spam: remover alertas duplicados do mesmo asset nos últimos 10 segundos
      const now = new Date();
      const validPrev = prev.filter(prevAlert => 
        (now.getTime() - prevAlert.timestamp.getTime()) > 10000 || 
        prevAlert.asset !== alert.asset
      );
      
      const newAlerts = [alert, ...validPrev];
      
      // Ordenar por strength e timestamp
      const sorted = newAlerts.sort((a, b) => {
        if (a.strength !== b.strength) return b.strength - a.strength;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      // Manter apenas os 100 alertas mais recentes
      return sorted.slice(0, 100);
    });
  }, []);

  // Registrar handler de alertas
  useEffect(() => {
    realKlineVolumeService.onVolumeAlert(handleVolumeAlert);
  }, [handleVolumeAlert]);

  // Limpeza automática de alertas antigos
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setAlerts(prev => {
        const filtered = prev.filter(alert => 
          (now.getTime() - alert.timestamp.getTime()) < 10 * 60 * 1000 // 10 minutos
        );
        
        if (filtered.length !== prev.length) {
          console.log(`🧹 CLEANUP: ${prev.length - filtered.length} alertas antigos removidos`);
        }
        
        return filtered;
      });
    }, 30000); // Limpeza a cada 30 segundos

    return () => clearInterval(cleanup);
  }, []);

  // Monitorar status da conexão
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = realKlineVolumeService.isConnected();
      const status = realKlineVolumeService.getConnectionStatus();
      
      setIsConnected(connected);
      setConnectionStatus(status.status);
      setConnectionInfo(status);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Separar alertas por tipo
  const getSpotAlerts = () => alerts.filter(a => a.marketType === 'spot');
  const getFuturesAlerts = () => alerts.filter(a => a.marketType === 'futures');
  
  // Estatísticas
  const getStats = () => {
    const spotCount = getSpotAlerts().length;
    const futuresCount = getFuturesAlerts().length;
    const strongAlerts = alerts.filter(a => a.strength >= 4).length;
    
    return {
      total: alerts.length,
      spot: spotCount,
      futures: futuresCount,
      strong: strongAlerts
    };
  };

  return {
    allAlerts: alerts,
    spotAlerts: getSpotAlerts(),
    futuresAlerts: getFuturesAlerts(),
    isConnected,
    connectionStatus,
    connectionInfo,
    stats: getStats(),
    totalAlerts: alerts.length
  };
};