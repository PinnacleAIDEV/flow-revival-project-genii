import { useState, useEffect, useCallback } from 'react';

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

interface BinanceTickerData {
  symbol: string;
  volume: string;
  quoteVolume: string;
  priceChangePercent: string;
  lastPrice: string;
  count: number;
}

export const useVolumeDetector = () => {
  const [alerts, setAlerts] = useState<VolumeAlert[]>([]);
  const [currentMode, setCurrentMode] = useState<MarketMode>('spot');
  const [volumeHistory] = useState<Map<string, number[]>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  
  // Lista de ativos para monitoramento
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
        console.log(`🔄 VOLUME DETECTOR: Alternando para modo ${newMode.toUpperCase()}`);
        return newMode;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchVolumeData = useCallback(async (mode: MarketMode) => {
    try {
      const targetAssets = mode === 'spot' ? spotAssets : futuresAssets;
      const baseUrl = mode === 'spot' 
        ? 'https://api.binance.com/api/v3/ticker/24hr'
        : 'https://fapi.binance.com/fapi/v1/ticker/24hr';

      const response = await fetch(baseUrl);
      if (!response.ok) throw new Error('Failed to fetch data');

      const data: BinanceTickerData[] = await response.json();
      const filteredData = data.filter(item => targetAssets.includes(item.symbol));
      
      setIsConnected(true);
      return filteredData;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de volume:', error);
      setIsConnected(false);
      return [];
    }
  }, [spotAssets, futuresAssets]);

  const detectVolumeAnomaly = useCallback((
    ticker: string,
    volume: number,
    price: number,
    priceChange: number,
    mode: MarketMode
  ): VolumeAlert | null => {
    // Histórico de volume para calcular média
    const history = volumeHistory.get(ticker) || [];
    history.push(volume);
    
    // Manter apenas últimos 20 valores
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

    // Determinar tipo baseado no modo e movimento de preço
    let alertType: VolumeAlert['type'];
    if (mode === 'spot') {
      alertType = priceChange >= 0 ? 'spot_buy' : 'spot_sell';
    } else {
      alertType = priceChange >= 0 ? 'futures_long' : 'futures_short';
    }

    // Calcular força do sinal
    let strength = 1;
    if (volumeSpike >= 10) strength = 5;
    else if (volumeSpike >= 7) strength = 4;
    else if (volumeSpike >= 5) strength = 3;
    else if (volumeSpike >= 3) strength = 2;

    // Bonus por movimento de preço significativo
    if (Math.abs(priceChange) >= 2) strength = Math.min(5, strength + 1);

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
  }, [volumeHistory]);

  // Buscar dados baseado no modo atual
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchVolumeData(currentMode);
      
      if (data.length === 0) return;

      const newAlerts: VolumeAlert[] = [];
      
      console.log(`📊 Processando ${data.length} ativos no modo: ${currentMode.toUpperCase()}`);

      data.forEach(item => {
        const volume = parseFloat(item.quoteVolume);
        const price = parseFloat(item.lastPrice);
        const priceChange = parseFloat(item.priceChangePercent);

        if (isNaN(volume) || isNaN(price)) return;

        const alert = detectVolumeAnomaly(
          item.symbol,
          volume,
          price,
          priceChange,
          currentMode
        );

        if (alert) {
          newAlerts.push(alert);
          console.log(`🚨 VOLUME ALERT: ${alert.type.toUpperCase()} - ${alert.asset} - ${alert.volumeSpike.toFixed(1)}x volume spike`);
        }
      });

      if (newAlerts.length > 0) {
        setAlerts(prev => {
          const combined = [...newAlerts, ...prev];
          return combined
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 100);
        });
      }
    };

    // Buscar dados imediatamente e depois a cada 10 segundos
    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, [currentMode, fetchVolumeData, detectVolumeAnomaly]);

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
    connectionStatus: isConnected ? 'connected' : 'disconnected'
  };
};