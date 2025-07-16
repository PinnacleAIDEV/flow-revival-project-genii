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
  
  // Lista expandida de ativos para altcoin season
  const spotAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 
    'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT',
    'UNIUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'TRXUSDT',
    'SHIBUSDT', 'PEPEUSDT', 'WIFUSDT', 'BONKUSDT', 'FETUSDT', 'AIUSDT',
    'NEARUSDT', 'RNDRUSDT', 'SUIUSDT', 'ARUSDT', 'JUPUSDT', 'PYUSDT',
    'WLDUSDT', 'INJUSDT', 'FILUSDT', 'GALAUSDT', 'MANTAUSDT', 'RUNEUSDT'
  ];

  const futuresAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'ADAUSDT',
    'DOGEUSDT', 'LINKUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT', 'UNIUSDT',
    'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'TRXUSDT', 'MANAUSDT',
    'SHIBUSDT', 'PEPEUSDT', 'WIFUSDT', 'BONKUSDT', 'FETUSDT', 'AIUSDT',
    'NEARUSDT', 'RNDRUSDT', 'SUIUSDT', 'ARUSDT', 'JUPUSDT', 'PYUSDT',
    'WLDUSDT', 'INJUSDT', 'FILUSDT', 'GALAUSDT', 'MANTAUSDT', 'RUNEUSDT'
  ];

  // Alternar entre spot e futures a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMode(prev => {
        const newMode = prev === 'spot' ? 'futures' : 'spot';
        console.log(`🔄 VOLUME DETECTOR: Alternando para modo ${newMode.toUpperCase()}`);
        return newMode;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const detectVolumeAnomaly = useCallback((
    ticker: string,
    volume: number,
    price: number,
    priceChange: number,
    mode: MarketMode
  ): VolumeAlert | null => {
    // Filtrar apenas ativos do modo atual
    const targetAssets = mode === 'spot' ? spotAssets : futuresAssets;
    if (!targetAssets.includes(ticker)) return null;

    // Histórico de volume para calcular média
    const history = volumeHistory.get(ticker) || [];
    history.push(volume);
    
    // Manter apenas últimos 20 valores
    if (history.length > 20) {
      history.shift();
    }
    volumeHistory.set(ticker, history);

    // Apenas 3 pontos necessários para altcoin season (mais sensível)
    if (history.length < 3) return null;

    const avgVolume = history.reduce((sum, v) => sum + v, 0) / history.length;
    const volumeSpike = volume / avgVolume;

    // Threshold reduzido para altcoin season: 1.5x+ acima da média
    if (volumeSpike < 1.5) return null;

    // Determinar tipo baseado no modo e movimento de preço
    let alertType: VolumeAlert['type'];
    if (mode === 'spot') {
      alertType = priceChange >= 0 ? 'spot_buy' : 'spot_sell';
    } else {
      alertType = priceChange >= 0 ? 'futures_long' : 'futures_short';
    }

    // Força ajustada para altcoin season
    let strength = 1;
    if (volumeSpike >= 5) strength = 5;
    else if (volumeSpike >= 3) strength = 4;
    else if (volumeSpike >= 2) strength = 3;
    else if (volumeSpike >= 1.5) strength = 2;

    // Bonus por movimento de preço significativo (reduzido de 2% para 1%)
    if (Math.abs(priceChange) >= 1) strength = Math.min(5, strength + 1);

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
  }, [volumeHistory, spotAssets, futuresAssets]);

  // Processar dados em tempo real do WebSocket
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const newAlerts: VolumeAlert[] = [];
    
    console.log(`📊 WEBSOCKET: Processando ${flowData.length} ativos em tempo real - modo ${currentMode.toUpperCase()}`);

    // Filtrar apenas dados de preço (não liquidações) para volume analysis
    const priceData = flowData.filter(data => !data.isLiquidation);
    
    priceData.forEach(data => {
      if (!data.ticker || !data.volume || !data.price) return;

      // Calcular volume em USD para comparação
      const volumeUSD = data.volume * data.price;

      console.log(`🔍 WebSocket ${data.ticker}: vol=${volumeUSD.toFixed(0)} USD, price=${data.price}, change=${data.change_24h?.toFixed(2)}%`);

      const alert = detectVolumeAnomaly(
        data.ticker,
        volumeUSD,
        data.price,
        data.change_24h || 0,
        currentMode
      );

      if (alert) {
        newAlerts.push(alert);
        console.log(`🚨 WEBSOCKET ALERT: ${alert.type.toUpperCase()} - ${alert.asset} - ${alert.volumeSpike.toFixed(2)}x spike | Price: ${alert.priceMovement.toFixed(2)}% | Strength: ${alert.strength}/5`);
      }
    });

    console.log(`📋 WebSocket alertas gerados: ${newAlerts.length}`);

    // Adicionar novos alertas apenas se houver dados novos
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        // Filtrar alertas duplicados
        const existingIds = new Set(prev.map(a => a.id));
        const uniqueNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
        
        if (uniqueNewAlerts.length === 0) return prev;
        
        const combined = [...uniqueNewAlerts, ...prev];
        return combined
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 100);
      });
    }
  }, [flowData, currentMode, detectVolumeAnomaly]);

  // Limpeza automática de alertas antigos
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setAlerts(prev => prev.filter(alert => 
        (now.getTime() - alert.timestamp.getTime()) < 15 * 60 * 1000
      ));
    }, 60000);

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