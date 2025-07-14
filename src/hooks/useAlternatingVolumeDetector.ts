
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

export const useAlternatingVolumeDetector = () => {
  const { flowData } = useRealFlowData();
  const [alerts, setAlerts] = useState<VolumeAlert[]>([]);
  const [currentMode, setCurrentMode] = useState<MarketMode>('spot');
  const [volumeHistory] = useState<Map<string, number[]>>(new Map());
  
  // Lista de ativos para spot e futures
  const spotAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 
    'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT',
    'UNIUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'TRXUSDT'
  ];

  const futuresAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'ADAUSDT',
    'DOGEUSDT', 'LINKUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT', 'UNIUSDT',
    'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'TRXUSDT', 'MANAUSDT'
  ];

  // Alternar entre spot e futures a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMode(prev => {
        const newMode = prev === 'spot' ? 'futures' : 'spot';
        console.log(`🔄 Alternando para modo: ${newMode.toUpperCase()}`);
        return newMode;
      });
    }, 30000); // 30 segundos

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
    
    // Manter apenas últimos 20 valores (1 hora de dados)
    if (history.length > 20) {
      history.shift();
    }
    volumeHistory.set(ticker, history);

    // Precisa de pelo menos 10 pontos para calcular média
    if (history.length < 10) return null;

    const avgVolume = history.reduce((sum, v) => sum + v, 0) / history.length;
    const volumeSpike = volume / avgVolume;

    // Detectar anomalia: volume 3x+ acima da média
    if (volumeSpike < 3.0) return null;

    // Calcular movimento de preço
    const priceMovement = priceChange;

    // Determinar tipo baseado no modo e movimento de preço
    let alertType: VolumeAlert['type'];
    if (mode === 'spot') {
      alertType = priceMovement >= 0 ? 'spot_buy' : 'spot_sell';
    } else {
      alertType = priceMovement >= 0 ? 'futures_long' : 'futures_short';
    }

    // Calcular força do sinal
    let strength = 1;
    if (volumeSpike >= 10) strength = 5;
    else if (volumeSpike >= 7) strength = 4;
    else if (volumeSpike >= 5) strength = 3;
    else if (volumeSpike >= 3) strength = 2;

    // Bonus por movimento de preço significativo
    if (Math.abs(priceMovement) >= 2) strength = Math.min(5, strength + 1);

    return {
      id: `${ticker}-${mode}-${Date.now()}`,
      asset: ticker.replace('USDT', ''),
      ticker,
      type: alertType,
      volume,
      volumeSpike,
      price,
      priceMovement,
      change24h: priceChange,
      timestamp: new Date(),
      strength,
      avgVolume
    };
  }, [volumeHistory, spotAssets, futuresAssets]);

  // Processar dados em tempo real baseado no modo atual
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const newAlerts: VolumeAlert[] = [];
    const now = new Date();

    console.log(`🔍 Processando ${flowData.length} ativos no modo: ${currentMode.toUpperCase()}`);

    flowData.forEach(data => {
      if (!data.ticker || !data.volume || !data.price) return;

      const alert = detectVolumeAnomaly(
        data.ticker,
        data.volume,
        data.price,
        data.change_24h || 0,
        currentMode
      );

      if (alert) {
        // Verificar se não existe alerta similar recente (mesmo ativo, últimos 2 minutos)
        const recentAlert = alerts.find(a => 
          a.asset === alert.asset && 
          a.type === alert.type &&
          (now.getTime() - a.timestamp.getTime()) < 2 * 60 * 1000
        );

        if (!recentAlert) {
          newAlerts.push(alert);
          console.log(`🚨 ${alert.type.toUpperCase()}: ${alert.asset} - Volume: ${alert.volumeSpike.toFixed(1)}x - Price: ${alert.priceMovement.toFixed(2)}%`);
        }
      }
    });

    // Adicionar novos alertas e manter apenas os últimos 50
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const combined = [...newAlerts, ...prev];
        return combined
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 50);
      });
    }

    // Limpeza automática de alertas antigos (mais de 15 minutos)
    setAlerts(prev => prev.filter(alert => 
      (now.getTime() - alert.timestamp.getTime()) < 15 * 60 * 1000
    ));

  }, [flowData, currentMode, detectVolumeAnomaly]);

  const getSpotAlerts = () => alerts.filter(a => a.type.startsWith('spot_'));
  const getFuturesAlerts = () => alerts.filter(a => a.type.startsWith('futures_'));

  return {
    allAlerts: alerts,
    spotAlerts: getSpotAlerts(),
    futuresAlerts: getFuturesAlerts(),
    currentMode,
    totalAlerts: alerts.length
  };
};
