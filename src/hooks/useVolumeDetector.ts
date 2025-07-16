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
      
      console.log(`📡 Fetched ${filteredData.length} assets for ${mode.toUpperCase()} mode`);
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
  }, [volumeHistory]);

  // Buscar dados baseado no modo atual
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchVolumeData(currentMode);
      
      if (data.length === 0) return;

      const newAlerts: VolumeAlert[] = [];
      
      console.log(`📊 ALTCOIN SEASON: Processando ${data.length} ativos no modo ${currentMode.toUpperCase()}`);
      console.log(`📈 Samples dos volumes:`, data.slice(0, 3).map(d => ({ symbol: d.symbol, vol: d.quoteVolume, change: d.priceChangePercent })));

      data.forEach(item => {
        const volume = parseFloat(item.quoteVolume);
        const price = parseFloat(item.lastPrice);
        const priceChange = parseFloat(item.priceChangePercent);

        console.log(`🔍 Checking ${item.symbol}: vol=${volume.toFixed(0)}, price=${price}, change=${priceChange.toFixed(2)}%`);

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
          console.log(`🚨 ALTCOIN ALERT: ${alert.type.toUpperCase()} - ${alert.asset} - ${alert.volumeSpike.toFixed(2)}x spike | Price: ${alert.priceMovement.toFixed(2)}% | Strength: ${alert.strength}/5`);
        }
      });

      console.log(`📋 Total alertas gerados: ${newAlerts.length}`);

      if (newAlerts.length > 0) {
        setAlerts(prev => {
          const combined = [...newAlerts, ...prev];
          return combined
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 100);
        });
      }
    };

    // Buscar dados imediatamente e depois a cada 5 segundos (mais responsivo)
    fetchData();
    const interval = setInterval(fetchData, 5000);

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