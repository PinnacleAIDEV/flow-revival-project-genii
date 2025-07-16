import { useState, useEffect, useCallback } from 'react';
import { useRealFlowData } from './useRealFlowData';

interface VolumeAlert {
  id: string;
  asset: string;
  ticker: string;
  type: 'spot_buy' | 'spot_sell' | 'futures_long' | 'futures_short';
  volume: number;
  volumeSpike: number;
  price: number;
  priceMovement: number;
  change24h: number;
  timestamp: Date;
  strength: number;
  avgVolume: number;
}

type MarketMode = 'spot' | 'futures';

export const useVolumeDetector = () => {
  const { flowData, isConnected, connectionStatus } = useRealFlowData();
  const [alerts, setAlerts] = useState<VolumeAlert[]>([]);
  const [currentMode, setCurrentMode] = useState<MarketMode>('spot');
  const [volumeHistory] = useState<Map<string, number[]>>(new Map());
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(0);
  
  // Lista expandida de ativos para WebSocket real-time
  const webSocketAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 
    'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT',
    'UNIUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'TRXUSDT',
    'SHIBUSDT', 'PEPEUSDT', 'WIFUSDT', 'BONKUSDT', 'FETUSDT', 'AIUSDT',
    'NEARUSDT', 'RNDRUSDT', 'SUIUSDT', 'ARUSDT', 'JUPUSDT', 'PYUSDT',
    'WLDUSDT', 'INJUSDT', 'FILUSDT', 'GALAUSDT', 'MANTAUSDT', 'RUNEUSDT',
    'MANAUSDT', 'SANDUSDT', 'AXSUSDT', 'APEUSDT', 'CHZUSDT', 'ENJUSDT',
    'QNTUSDT', 'FLOWUSDT', 'ICPUSDT', 'THETAUSDT', 'XTZUSDT', 'MKRUSDT'
  ];

  // WebSocket não precisa alternar - monitora tudo simultaneamente
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMode(prev => {
        const newMode = prev === 'spot' ? 'futures' : 'spot';
        console.log(`🔄 WEBSOCKET MODE: Focando em ${newMode.toUpperCase()} (mas monitorando ambos)`);
        return newMode;
      });
    }, 20000); // Reduzido para 20s por ser WebSocket

    return () => clearInterval(interval);
  }, []);

  const detectVolumeAnomaly = useCallback((
    ticker: string,
    volume: number,
    price: number,
    priceChange: number,
    mode: MarketMode
  ): VolumeAlert | null => {
    // Filtrar ativos que estão no WebSocket
    if (!webSocketAssets.includes(ticker)) return null;

    // Para WebSocket, consideramos todos os dados como válidos (spot/futures determinado pelo contexto)
    const volumeKey = `${ticker}_${mode}`;
    const history = volumeHistory.get(volumeKey) || [];
    history.push(volume);
    
    // Manter apenas últimos 20 valores
    if (history.length > 20) {
      history.shift();
    }
    volumeHistory.set(volumeKey, history);

    // WebSocket permite detecção mais agressiva - apenas 2 pontos
    if (history.length < 2) return null;

    const avgVolume = history.reduce((sum, v) => sum + v, 0) / history.length;
    const volumeSpike = volume / avgVolume;

    // Threshold ainda mais baixo para WebSocket real-time: 1.2x
    if (volumeSpike < 1.2) return null;

    // WebSocket permite detectar todos os tipos simultaneamente
    let alertType: VolumeAlert['type'];
    if (priceChange >= 0) {
      alertType = Math.abs(priceChange) > 5 ? 'futures_long' : 'spot_buy';
    } else {
      alertType = Math.abs(priceChange) > 5 ? 'futures_short' : 'spot_sell';
    }

    // Força otimizada para WebSocket real-time
    let strength = 1;
    if (volumeSpike >= 3) strength = 5;
    else if (volumeSpike >= 2) strength = 4;
    else if (volumeSpike >= 1.5) strength = 3;
    else if (volumeSpike >= 1.2) strength = 2;

    // Bonus WebSocket: movimento de preço > 0.5%
    if (Math.abs(priceChange) >= 0.5) strength = Math.min(5, strength + 1);

    return {
      id: `${ticker}-${mode}-${Date.now()}-${Math.random()}`,
      asset: ticker.replace('USDT', ''),
      ticker,
      type: alertType,
      volume,
      volumeSpike,
      price,
      priceMovement: priceChange,
      change24h: priceChange,
      timestamp: new Date(),
      strength,
      avgVolume
    };
  }, [volumeHistory, webSocketAssets]);

  // Processar dados WebSocket em tempo real - otimizado
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    // Filtrar apenas dados novos para evitar reprocessamento
    const currentTimestamp = Date.now();
    if (currentTimestamp - lastProcessedTimestamp < 1000) return; // Throttle 1s
    
    setLastProcessedTimestamp(currentTimestamp);

    const newAlerts: VolumeAlert[] = [];
    
    console.log(`🌊 WEBSOCKET REAL-TIME: ${flowData.length} streams ativos | Status: ${connectionStatus}`);

    // Processar TODOS os dados não-liquidação disponíveis (remover filtro restritivo)
    const recentData = flowData.filter(data => !data.isLiquidation);
    
    console.log(`📊 Dados recentes para análise: ${recentData.length}/${flowData.length}`);
    
    recentData.forEach(data => {
      // Garantir que temos pelo menos ticker e price
      if (!data.ticker || !data.price) return;

      // Volume padrão se não houver dados
      const volume = data.volume || 1000;
      const trades = data.trades_count || 50;
      
      // Volume em USD + Volume de trades
      const volumeUSD = volume * data.price;
      const combinedVolume = volumeUSD + trades * 100;

      console.log(`⚡ Real-time ${data.ticker}: $${volumeUSD.toFixed(0)} | ${(data.change_24h || 0).toFixed(2)}% | Vol: ${volume}`);

      const alert = detectVolumeAnomaly(
        data.ticker,
        combinedVolume,
        data.price,
        data.change_24h || 0,
        currentMode
      );

      if (alert) {
        newAlerts.push(alert);
        console.log(`🚨 WEBSOCKET ALERT: ${alert.type.toUpperCase()} - ${alert.asset} - ${alert.volumeSpike.toFixed(2)}x | $${alert.priceMovement.toFixed(2)}% | ⭐${alert.strength}`);
      }
    });

    console.log(`📈 Real-time alertas: ${newAlerts.length} gerados`);

    // Sistema de alertas WebSocket otimizado
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        // Anti-spam: Filtrar alertas do mesmo ativo nos últimos 30 segundos
        const now = new Date();
        const validPrev = prev.filter(alert => 
          (now.getTime() - alert.timestamp.getTime()) > 30000 || 
          !newAlerts.some(newAlert => newAlert.asset === alert.asset)
        );
        
        const combined = [...newAlerts, ...validPrev];
        return combined
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 150); // Mais alertas para WebSocket
      });
    }
  }, [flowData, currentMode, detectVolumeAnomaly, lastProcessedTimestamp]);

  // Limpeza automática otimizada para WebSocket
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setAlerts(prev => prev.filter(alert => 
        (now.getTime() - alert.timestamp.getTime()) < 10 * 60 * 1000 // 10 minutos para WebSocket
      ));
    }, 30000); // Limpeza a cada 30 segundos

    return () => clearInterval(cleanup);
  }, []);

  const getSpotAlerts = () => alerts.filter(a => a.type.startsWith('spot_'));
  const getFuturesAlerts = () => alerts.filter(a => a.type.startsWith('futures_'));

  return {
    allAlerts: alerts,
    spotAlerts: getSpotAlerts(),
    futuresAlerts: getFuturesAlerts(),
    currentMode,
    totalAlerts: alerts.length,
    isConnected,
    connectionStatus: connectionStatus || 'disconnected'
  };
};