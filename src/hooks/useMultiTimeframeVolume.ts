import { useState, useEffect, useCallback } from 'react';
import { multiTimeframeVolumeService, MultiTimeframeAlert } from '../services/MultiTimeframeVolumeService';
import { supabase } from '@/integrations/supabase/client';

export const useMultiTimeframeVolume = () => {
  const [alerts, setAlerts] = useState<MultiTimeframeAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  // Conectar ao serviço
  useEffect(() => {
    const connect = async () => {
      try {
        await multiTimeframeVolumeService.connect();
        setIsConnected(true);
        setConnectionStatus('connected');
        
        const status = multiTimeframeVolumeService.getConnectionStatus();
        setConnectionInfo(status);
        
        console.log('✅ MULTI-TIMEFRAME VOLUME connected:', status);
      } catch (error) {
        console.error('❌ Failed to connect multi-timeframe volume service:', error);
        setIsConnected(false);
        setConnectionStatus('error');
      }
    };

    connect();

    // Cleanup
    return () => {
      multiTimeframeVolumeService.disconnect();
    };
  }, []);

  // Handler para novos alertas
  const handleAlert = useCallback((alert: MultiTimeframeAlert) => {
    setAlerts(prev => {
      // Anti-spam: remover alertas duplicados do mesmo ticker+timeframe nos últimos 5 segundos
      const now = new Date();
      const validPrev = prev.filter(prevAlert => 
        (now.getTime() - prevAlert.timestamp.getTime()) > 5000 || 
        prevAlert.ticker !== alert.ticker ||
        prevAlert.timeframe !== alert.timeframe
      );
      
      const newAlerts = [alert, ...validPrev];
      
      // Ordenar por strength, volume multiplier e timestamp
      const sorted = newAlerts.sort((a, b) => {
        if (a.strength !== b.strength) return b.strength - a.strength;
        if (a.volumeMultiplier !== b.volumeMultiplier) return b.volumeMultiplier - a.volumeMultiplier;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      // Manter apenas os 200 alertas mais recentes para performance
      return sorted.slice(0, 200);
    });
  }, []);

  // Registrar handler de alertas
  useEffect(() => {
    multiTimeframeVolumeService.onAlert(handleAlert);
  }, [handleAlert]);

  // Carregar alertas existentes do Supabase
  useEffect(() => {
    const loadExistingAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('unusual_volume_alerts')
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('strength', { ascending: false })
          .order('volume_multiplier', { ascending: false })
          .limit(100);

        if (error) {
          console.error('❌ Failed to load existing alerts:', error);
          return;
        }

        if (data && data.length > 0) {
          const convertedAlerts: MultiTimeframeAlert[] = data.map(row => ({
            id: row.id,
            ticker: row.ticker,
            asset: row.asset,
            timeframe: row.timeframe as '1m' | '3m' | '15m',
            marketType: row.market_type as 'spot' | 'futures',
            alertType: row.alert_type as 'buy' | 'sell' | 'long' | 'short',
            volumeBaseline: Number(row.volume_baseline),
            volumeCurrent: Number(row.volume_current),
            volumeMultiplier: Number(row.volume_multiplier),
            priceMovement: Number(row.price_movement),
            price: Number(row.price),
            strength: row.strength as 1 | 2 | 3 | 4 | 5,
            sessionRegion: row.session_region || 'unknown',
            tradesCount: row.trades_count || 0,
            timestamp: new Date(row.created_at_utc),
            expiresAt: new Date(row.expires_at)
          }));

          setAlerts(convertedAlerts);
          console.log(`📚 Loaded ${convertedAlerts.length} existing alerts from database`);
        }
      } catch (error) {
        console.error('❌ Error loading existing alerts:', error);
      }
    };

    loadExistingAlerts();
  }, []);

  // Limpeza automática de alertas antigos
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setAlerts(prev => {
        const filtered = prev.filter(alert => 
          alert.expiresAt.getTime() > now.getTime()
        );
        
        if (filtered.length !== prev.length) {
          console.log(`🧹 CLEANUP: ${prev.length - filtered.length} alertas expirados removidos`);
        }
        
        return filtered;
      });
    }, 60000); // Limpeza a cada minuto

    return () => clearInterval(cleanup);
  }, []);

  // Monitorar status da conexão
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = multiTimeframeVolumeService.isConnected();
      const status = multiTimeframeVolumeService.getConnectionStatus();
      
      setIsConnected(connected);
      setConnectionStatus(status.status);
      setConnectionInfo(status);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filtrar alertas por tipo
  const getSpotBuyAlerts = () => alerts.filter(a => a.marketType === 'spot' && a.alertType === 'buy');
  const getSpotSellAlerts = () => alerts.filter(a => a.marketType === 'spot' && a.alertType === 'sell');
  const getFuturesLongAlerts = () => alerts.filter(a => a.marketType === 'futures' && a.alertType === 'long');
  const getFuturesShortAlerts = () => alerts.filter(a => a.marketType === 'futures' && a.alertType === 'short');

  // Filtrar por timeframe
  const getAlertsByTimeframe = (timeframe: '1m' | '3m' | '15m') => 
    alerts.filter(a => a.timeframe === timeframe);

  // Filtrar por strength
  const getAlertsByStrength = (minStrength: number) => 
    alerts.filter(a => a.strength >= minStrength);

  // Estatísticas
  const getStats = () => {
    const spotBuyCount = getSpotBuyAlerts().length;
    const spotSellCount = getSpotSellAlerts().length;
    const futuresLongCount = getFuturesLongAlerts().length;
    const futuresShortCount = getFuturesShortAlerts().length;
    const strongAlerts = alerts.filter(a => a.strength >= 4).length;
    
    // Stats por timeframe
    const tf1mCount = getAlertsByTimeframe('1m').length;
    const tf3mCount = getAlertsByTimeframe('3m').length;
    const tf15mCount = getAlertsByTimeframe('15m').length;

    return {
      total: alerts.length,
      spotBuy: spotBuyCount,
      spotSell: spotSellCount,
      futuresLong: futuresLongCount,
      futuresShort: futuresShortCount,
      strong: strongAlerts,
      timeframes: {
        '1m': tf1mCount,
        '3m': tf3mCount,
        '15m': tf15mCount
      }
    };
  };

  return {
    // Todos os alertas
    allAlerts: alerts,
    
    // Alertas por categoria
    spotBuyAlerts: getSpotBuyAlerts(),
    spotSellAlerts: getSpotSellAlerts(),
    futuresLongAlerts: getFuturesLongAlerts(),
    futuresShortAlerts: getFuturesShortAlerts(),
    
    // Filtros
    getAlertsByTimeframe,
    getAlertsByStrength,
    
    // Status da conexão
    isConnected,
    connectionStatus,
    connectionInfo,
    
    // Estatísticas
    stats: getStats(),
    totalAlerts: alerts.length
  };
};