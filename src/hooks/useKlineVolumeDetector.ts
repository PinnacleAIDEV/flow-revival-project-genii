
import { useState, useEffect } from 'react';
import { useRealFlowData } from './useRealFlowData';

interface KlineVolumeAlert {
  id: string;
  asset: string;
  ticker: string;
  type: 'spot_buy' | 'spot_sell' | 'futures_long' | 'futures_short';
  volume: number;
  volumeMultiplier: number;
  price: number;
  priceMovement: number;
  change24h: number;
  timestamp: Date;
  timeframe: '3m';
  strength: number;
  avgVolume: number;
}

export const useKlineVolumeDetector = () => {
  const { flowData } = useRealFlowData();
  const [alerts, setAlerts] = useState<KlineVolumeAlert[]>([]);
  const [klineHistory] = useState<Map<string, Array<{
    volume: number;
    timestamp: number;
    open: number;
    close: number;
    high: number;
    low: number;
  }>>>(new Map());

  // Assets de alta liquidez (spot)
  const spotAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 
    'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT'
  ];

  // Assets populares em futures
  const futuresAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'ADAUSDT',
    'DOGEUSDT', 'LINKUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT'
  ];

  const detectVolumeAnomaly = (
    ticker: string, 
    currentVolume: number, 
    priceMovement: number,
    change24h: number,
    klineData: any
  ): KlineVolumeAlert | null => {
    const history = klineHistory.get(ticker) || [];
    
    // Precisa de pelo menos 20 klines para calcular média (1 hora de dados em 3min)
    if (history.length < 20) return null;

    // Calcular média de volume das últimas 20 klines (excluindo a atual)
    const recentHistory = history.slice(-20, -1);
    const avgVolume = recentHistory.reduce((sum, k) => sum + k.volume, 0) / recentHistory.length;
    
    // Detectar se volume é 3x+ acima da média
    const volumeMultiplier = currentVolume / avgVolume;
    
    if (volumeMultiplier < 3.0 || avgVolume === 0) return null;

    // Determinar tipo baseado no ativo e movimento
    let alertType: KlineVolumeAlert['type'];
    
    if (spotAssets.includes(ticker)) {
      alertType = priceMovement >= 0 ? 'spot_buy' : 'spot_sell';
    } else if (futuresAssets.includes(ticker)) {
      alertType = priceMovement >= 0 ? 'futures_long' : 'futures_short';
    } else {
      return null; // Ignorar assets não listados para economizar recursos
    }

    // Calcular força do sinal
    let strength = 1;
    if (volumeMultiplier >= 10) strength = 5;
    else if (volumeMultiplier >= 7) strength = 4;
    else if (volumeMultiplier >= 5) strength = 3;
    else if (volumeMultiplier >= 3) strength = 2;

    // Bonus por movimento de preço
    if (Math.abs(priceMovement) >= 1) strength = Math.min(5, strength + 1);

    return {
      id: `${ticker}-${Date.now()}`,
      asset: ticker.replace('USDT', ''),
      ticker,
      type: alertType,
      volume: currentVolume,
      volumeMultiplier,
      price: klineData.close,
      priceMovement,
      change24h,
      timestamp: new Date(),
      timeframe: '3m',
      strength,
      avgVolume
    };
  };

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const newAlerts: KlineVolumeAlert[] = [];
    const now = new Date();

    // Processar apenas dados com kline_volume (dados de 3min)
    flowData.forEach(data => {
      if (!data.kline_volume || !data.open || !data.close) return;

      const ticker = data.ticker;
      const history = klineHistory.get(ticker) || [];
      
      // Adicionar novo kline ao histórico
      const newKline = {
        volume: data.kline_volume,
        timestamp: data.timestamp,
        open: data.open,
        close: data.close,
        high: data.high,
        low: data.low
      };

      history.push(newKline);
      
      // Manter apenas últimos 40 klines (2 horas em 3min)
      while (history.length > 40) {
        history.shift();
      }
      
      klineHistory.set(ticker, history);

      // Calcular movimento de preço do kline atual
      const priceMovement = ((data.close - data.open) / data.open) * 100;
      
      // Detectar anomalia
      const alert = detectVolumeAnomaly(
        ticker,
        data.kline_volume,
        priceMovement,
        data.change_24h || 0,
        newKline
      );

      if (alert) {
        // Verificar se não existe alerta similar recente (mesmo asset, últimos 3 minutos)
        const recentAlert = alerts.find(a => 
          a.asset === alert.asset && 
          (now.getTime() - a.timestamp.getTime()) < 3 * 60 * 1000
        );

        if (!recentAlert) {
          newAlerts.push(alert);
        }
      }
    });

    // Adicionar novos alertas
    if (newAlerts.length > 0) {
      console.log(`📊 ${newAlerts.length} novos alertas de volume kline detectados`);
      
      setAlerts(prev => {
        const combined = [...newAlerts, ...prev];
        return combined
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 30); // Manter apenas 30 alertas mais recentes
      });
    }

    // Limpeza automática de alertas antigos (mais de 15 minutos)
    setAlerts(prev => prev.filter(alert => 
      (now.getTime() - alert.timestamp.getTime()) < 15 * 60 * 1000
    ));

  }, [flowData, alerts]);

  const getSpotAlerts = () => alerts.filter(a => a.type.startsWith('spot_'));
  const getFuturesAlerts = () => alerts.filter(a => a.type.startsWith('futures_'));

  return {
    allAlerts: alerts,
    spotAlerts: getSpotAlerts(),
    futuresAlerts: getFuturesAlerts(),
    totalAlerts: alerts.length
  };
};
