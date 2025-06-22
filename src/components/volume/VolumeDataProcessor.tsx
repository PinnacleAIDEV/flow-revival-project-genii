
import { useEffect, useCallback } from 'react';
import { useKlineVolumeDetector } from '../../hooks/useKlineVolumeDetector';

interface ProcessedVolumeData {
  spotVolume: Array<{
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
    type: string;
    strength: number;
    priceMovement: number;
  }>;
  futuresVolume: Array<{
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
    type: string;
    strength: number;
    priceMovement: number;
  }>;
  microcaps: never[];
}

interface VolumeDataProcessorProps {
  onDataProcessed: (data: ProcessedVolumeData) => void;
}

export const VolumeDataProcessor: React.FC<VolumeDataProcessorProps> = ({ 
  onDataProcessed 
}) => {
  const { spotAlerts, futuresAlerts } = useKlineVolumeDetector();

  // Memorizar a função de processamento para evitar loops infinitos
  const processData = useCallback(() => {
    const spotVolume = spotAlerts.map(alert => ({
      id: alert.id,
      symbol: alert.asset,
      volume: alert.volume,
      volumeSpike: alert.volumeMultiplier,
      price: alert.price,
      change24h: alert.change24h,
      exchange: 'Binance',
      timestamp: alert.timestamp.toISOString(),
      ticker: alert.ticker,
      trades_count: 0,
      type: alert.type,
      strength: alert.strength,
      priceMovement: alert.priceMovement
    }));

    const futuresVolume = futuresAlerts.map(alert => ({
      id: alert.id,
      symbol: alert.asset,
      volume: alert.volume,
      volumeSpike: alert.volumeMultiplier,
      price: alert.price,
      change24h: alert.change24h,
      exchange: 'Binance',
      timestamp: alert.timestamp.toISOString(),
      ticker: alert.ticker,
      trades_count: 0,
      type: alert.type,
      strength: alert.strength,
      priceMovement: alert.priceMovement
    }));

    onDataProcessed({
      spotVolume,
      futuresVolume,
      microcaps: []
    });

    console.log(`📊 Kline Volume Updated: Spot=${spotVolume.length}, Futures=${futuresVolume.length}`);
  }, [spotAlerts, futuresAlerts, onDataProcessed]);

  useEffect(() => {
    processData();
  }, [processData]);

  return null;
};
