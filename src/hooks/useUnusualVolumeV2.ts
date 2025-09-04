import { useState, useEffect, useCallback } from 'react';
import { unusualVolumeV2Service, UnusualVolumeAlert } from '../services/UnusualVolumeV2Service';
import { supabase } from '@/integrations/supabase/client';

export const useUnusualVolumeV2 = () => {
  const [alerts, setAlerts] = useState<UnusualVolumeAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  // Connect to V2 service
  useEffect(() => {
    const connect = async () => {
      try {
        console.log('🚀 Connecting to Unusual Volume V2 Service...');
        await unusualVolumeV2Service.connect();
        setIsConnected(true);
        setConnectionStatus('connected');
        
        const status = unusualVolumeV2Service.getConnectionStatus();
        setConnectionInfo(status);
        
        console.log('✅ UNUSUAL VOLUME V2 connected:', status);
      } catch (error) {
        console.error('❌ Failed to connect unusual volume V2 service:', error);
        setIsConnected(false);
        setConnectionStatus('error');
      }
    };

    connect();

    // Cleanup
    return () => {
      unusualVolumeV2Service.disconnect();
    };
  }, []);

  // Handler for new alerts with improved anti-spam
  const handleAlert = useCallback((alert: UnusualVolumeAlert) => {
    setAlerts(prev => {
      // Enhanced anti-spam: remove alerts for same ticker+timeframe+marketType in last 10 seconds
      const now = new Date();
      const validPrev = prev.filter(prevAlert => {
        const timeDiff = now.getTime() - prevAlert.timestamp.getTime();
        const isDuplicate = (
          prevAlert.ticker === alert.ticker &&
          prevAlert.timeframe === alert.timeframe &&
          prevAlert.marketType === alert.marketType &&
          timeDiff < 10000 // 10 seconds
        );
        return !isDuplicate;
      });
      
      const newAlerts = [alert, ...validPrev];
      
      // Sort by strength first, then volume multiplier, then timestamp
      const sorted = newAlerts.sort((a, b) => {
        if (a.strength !== b.strength) return b.strength - a.strength;
        if (Math.abs(a.volumeMultiplier - b.volumeMultiplier) > 0.1) {
          return b.volumeMultiplier - a.volumeMultiplier;
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      // Keep only the 150 most relevant alerts for performance
      return sorted.slice(0, 150);
    });
  }, []);

  // Register alert handler
  useEffect(() => {
    unusualVolumeV2Service.onAlert(handleAlert);
  }, [handleAlert]);

  // Load existing alerts from Supabase with better error handling
  useEffect(() => {
    const loadExistingAlerts = async () => {
      try {
        console.log('📚 Loading existing alerts from database...');
        const { data, error } = await supabase
          .from('unusual_volume_alerts')
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('strength', { ascending: false })
          .order('volume_multiplier', { ascending: false })
          .order('created_at_utc', { ascending: false })
          .limit(100);

        if (error) {
          console.error('❌ Failed to load existing alerts:', error);
          return;
        }

        if (data && data.length > 0) {
          const convertedAlerts: UnusualVolumeAlert[] = data
            .filter(row => {
              // Filter out any malformed data
              return (
                row.ticker &&
                row.asset &&
                row.timeframe &&
                row.market_type &&
                row.alert_type &&
                !isNaN(Number(row.volume_baseline)) &&
                !isNaN(Number(row.volume_current)) &&
                !isNaN(Number(row.volume_multiplier)) &&
                !isNaN(Number(row.price_movement)) &&
                !isNaN(Number(row.price)) &&
                row.strength >= 1 && row.strength <= 5
              );
            })
            .map(row => ({
              id: row.id,
              ticker: row.ticker,
              asset: row.asset,
              timeframe: row.timeframe as '1m' | '3m' | '15m',
              marketType: row.market_type as 'spot' | 'futures',
              alertType: row.alert_type as 'buy' | 'sell' | 'long' | 'short',
              volumeBaseline: Number(row.volume_baseline) || 0,
              volumeCurrent: Number(row.volume_current) || 0,
              volumeMultiplier: Number(row.volume_multiplier) || 1,
              priceMovement: Number(row.price_movement) || 0,
              price: Number(row.price) || 0,
              strength: row.strength as 1 | 2 | 3 | 4 | 5,
              sessionRegion: row.session_region || 'unknown',
              tradesCount: row.trades_count || 0,
              timestamp: new Date(row.created_at_utc),
              expiresAt: new Date(row.expires_at)
            }));

          setAlerts(convertedAlerts);
          console.log(`📚 Loaded ${convertedAlerts.length} valid existing alerts from database`);
        }
      } catch (error) {
        console.error('❌ Error loading existing alerts:', error);
      }
    };

    loadExistingAlerts();
  }, []);

  // Automatic cleanup of expired alerts
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setAlerts(prev => {
        const filtered = prev.filter(alert => 
          alert.expiresAt.getTime() > now.getTime()
        );
        
        if (filtered.length !== prev.length) {
          console.log(`🧹 V2 CLEANUP: ${prev.length - filtered.length} expired alerts removed`);
        }
        
        return filtered;
      });
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanup);
  }, []);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = unusualVolumeV2Service.isConnected();
      const status = unusualVolumeV2Service.getConnectionStatus();
      
      setIsConnected(connected);
      setConnectionStatus(status.status);
      setConnectionInfo(status);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter alerts by type with null safety
  const getSpotBuyAlerts = () => alerts.filter(a => a?.marketType === 'spot' && a?.alertType === 'buy');
  const getSpotSellAlerts = () => alerts.filter(a => a?.marketType === 'spot' && a?.alertType === 'sell');
  const getFuturesLongAlerts = () => alerts.filter(a => a?.marketType === 'futures' && a?.alertType === 'long');
  const getFuturesShortAlerts = () => alerts.filter(a => a?.marketType === 'futures' && a?.alertType === 'short');

  // Filter by timeframe with null safety
  const getAlertsByTimeframe = (timeframe: '1m' | '3m' | '15m') => 
    alerts.filter(a => a?.timeframe === timeframe);

  // Filter by strength with null safety
  const getAlertsByStrength = (minStrength: number) => 
    alerts.filter(a => a?.strength >= minStrength);

  // Enhanced statistics with null safety
  const getStats = () => {
    const validAlerts = alerts.filter(a => a && a.strength && a.marketType && a.alertType && a.timeframe);
    
    const spotBuyCount = validAlerts.filter(a => a.marketType === 'spot' && a.alertType === 'buy').length;
    const spotSellCount = validAlerts.filter(a => a.marketType === 'spot' && a.alertType === 'sell').length;
    const futuresLongCount = validAlerts.filter(a => a.marketType === 'futures' && a.alertType === 'long').length;
    const futuresShortCount = validAlerts.filter(a => a.marketType === 'futures' && a.alertType === 'short').length;
    const strongAlerts = validAlerts.filter(a => a.strength >= 4).length;
    
    // Stats by timeframe
    const tf1mCount = validAlerts.filter(a => a.timeframe === '1m').length;
    const tf3mCount = validAlerts.filter(a => a.timeframe === '3m').length;
    const tf15mCount = validAlerts.filter(a => a.timeframe === '15m').length;

    return {
      total: validAlerts.length,
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
    // All alerts
    allAlerts: alerts,
    
    // Alerts by category
    spotBuyAlerts: getSpotBuyAlerts(),
    spotSellAlerts: getSpotSellAlerts(),
    futuresLongAlerts: getFuturesLongAlerts(),
    futuresShortAlerts: getFuturesShortAlerts(),
    
    // Filters
    getAlertsByTimeframe,
    getAlertsByStrength,
    
    // Connection status
    isConnected,
    connectionStatus,
    connectionInfo,
    
    // Statistics
    stats: getStats(),
    totalAlerts: alerts.length,
    
    // Service version
    version: 'V2'
  };
};
