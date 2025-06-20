
import { useEffect, useState } from 'react';
import { FlowData } from '../../services/BinanceWebSocketService';

interface VolumeData {
  id: string;
  symbol: string;
  volume: number;
  volumeSpike: number;
  price: number;
  change24h: number;
  exchange: string;
  timestamp: string;
  ticker: string;
  trades_count: number;
}

interface ProcessedVolumeData {
  spotVolume: VolumeData[];
  futuresVolume: VolumeData[];
  microcaps: VolumeData[];
}

interface VolumeDataProcessorProps {
  flowData: FlowData[];
  onDataProcessed: (data: ProcessedVolumeData) => void;
}

export const VolumeDataProcessor: React.FC<VolumeDataProcessorProps> = ({ 
  flowData, 
  onDataProcessed 
}) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Asset classifications
  const highMarketCapAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 
    'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT',
    'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'NEOUSDT', 'ALGOUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT',
    'APEUSDT', 'CHZUSDT', 'GALAUSDT', 'ENJUSDT', 'NEARUSDT', 'QNTUSDT', 'FLOWUSDT', 'ICPUSDT',
    'THETAUSDT', 'XTZUSDT', 'MKRUSDT', 'FTMUSDT', 'AAVEUSDT', 'SNXUSDT', 'CRVUSDT', 'COMPUSDT',
    'UNIUSDT', 'SUSHIUSDT', 'YFIUSDT', 'ZRXUSDT', 'BATUSDT', 'RENUSDT', 'KNCUSDT', 'LRCUSDT'
  ];

  const microcapAssets = [
    'PEPEUSDT', 'SHIBUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT', 'MEMEUSDT', 'TURBOUSDT',
    '1000RATSUSDT', 'ORDIUSDT', '1000SATSUSDT', 'BOMEUSDT', 'JUPUSDT', 'WUSDT'
  ];

  const processRealData = () => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    
    // Process flow data for unusual volume detection
    const processedData: VolumeData[] = flowData
      .filter(data => {
        const volumeValue = data.volume * data.price;
        const priceChange = Math.abs(data.change_24h || 0);
        
        // Enhanced volume spike detection
        const baseVolumeThreshold = highMarketCapAssets.includes(data.ticker) ? 50000 : 15000;
        const volumeSpike = volumeValue / baseVolumeThreshold;
        
        return volumeSpike >= 3.0 && priceChange >= 0.5; // 3x volume spike + 0.5% price movement
      })
      .map(data => {
        const volumeValue = data.volume * data.price;
        const baseVolumeThreshold = highMarketCapAssets.includes(data.ticker) ? 50000 : 15000;
        const volumeSpike = volumeValue / baseVolumeThreshold;
        
        return {
          id: `${data.ticker}-${data.timestamp}`,
          symbol: data.ticker.replace('USDT', ''),
          volume: volumeValue,
          volumeSpike: volumeSpike,
          price: data.price,
          change24h: data.change_24h || 0,
          exchange: 'Binance',
          timestamp: new Date(data.timestamp).toISOString(), // Convert number to string
          ticker: data.ticker,
          trades_count: data.trades_count || 0
        };
      })
      .sort((a, b) => b.volumeSpike - a.volumeSpike);

    // Categorize data
    const futures = processedData.filter(item => 
      !microcapAssets.includes(item.ticker) && 
      (item.volumeSpike >= 4.0 || item.volume >= 100000)
    ).slice(0, 20);
    
    const spot = processedData.filter(item => 
      highMarketCapAssets.includes(item.ticker) && 
      item.volumeSpike >= 3.0
    ).slice(0, 20);
    
    const microcap = processedData.filter(item => 
      microcapAssets.includes(item.ticker) || 
      (!highMarketCapAssets.includes(item.ticker) && item.volume < 100000)
    ).slice(0, 20);

    onDataProcessed({
      spotVolume: spot,
      futuresVolume: futures,
      microcaps: microcap
    });

    setLastUpdate(now);
    console.log(`📊 Unusual Volume Updated: Spot=${spot.length}, Futures=${futures.length}, Microcaps=${microcap.length}`);
  };

  // Process real data when flowData changes
  useEffect(() => {
    processRealData();
  }, [flowData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      processRealData();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [flowData]);

  return null; // This is a data processor component, no UI
};
