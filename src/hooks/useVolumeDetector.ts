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
  
  // MASSIVE FUTURES EXPANSION - ALTCOIN SEASON OPTIMIZED (150+ ASSETS)
  const futuresPriorityAssets = [
    // MAJOR CAPS
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'ATOMUSDT',
    
    // MEMECOINS FUTURES (ALTCOIN SEASON FOCUS)
    'DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT', 'MEMEUSDT', 'BRETTUSDT', 'POPUSDT',
    
    // AI/TECH FUTURES (HOT SECTOR)
    'FETUSDT', 'AGIXUSDT', 'OCEANUSDT', 'RENDERUSDT', 'THETAUSDT', 'ARKMUSDT', 'PHBUSDT', 'AIUSDT', 'AGIUSDT',
    
    // GAMING/NFT FUTURES
    'AXSUSDT', 'SANDUSDT', 'MANAUSDT', 'ENJUSDT', 'GALAUSDT', 'CHZUSDT', 'FLOWUSDT', 'ILVUSDT', 'GMTUSDT',
    
    // LAYER 1s FUTURES
    'NEARUSDT', 'SUIUSDT', 'APTUSDT', 'SEIUSDT', 'INJUSDT', 'KASUSDT', 'TIAAUSDT', 'STRKUSDT',
    
    // DEFI FUTURES
    'UNIUSDT', 'AAVEUSDT', 'CRVUSDT', 'SUSHIUSDT', '1INCHUSDT', 'COMPUSDT', 'MKRUSDT', 'SNXUSDT', 'RUNEUSDT',
    
    // INFRASTRUCTURE
    'FILUSDT', 'ARUSDT', 'STORJUSDT', 'ICPUSDT', 'GRTUSDT', 'RNDRUSDT', 'ORDIUSDT', 'STXUSDT',
    
    // ALTCOIN SEASON FAVORITES
    'JUPUSDT', 'PYUSDT', 'WLDUSDT', 'MANTAUSDT', 'APEUSDT', 'LDOUSDT', 'JTOOSDT', 'ALTUSDT',
    
    // NEW LISTINGS & TRENDING
    'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'TRXUSDT', 'QNTUSDT', 'XTZUSDT', 'ALGOUSDT'
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
    mode: MarketMode,
    tradesCount: number = 0
  ): VolumeAlert | null => {
    // REMOVER WHITELIST - Aceitar TODOS os tickers do WebSocket
    // Priorizar futures da lista expandida para maior precisão
    const isFuturesPriority = futuresPriorityAssets.includes(ticker);
    
    console.log(`🔍 Analisando ${ticker}: Vol=${volume}, Price=${priceChange.toFixed(2)}%, Trades=${tradesCount}, Priority=${isFuturesPriority}`);

    // Smart Volume Calculation - Sem mínimos
    const volumeKey = `${ticker}_${mode}`;
    const history = volumeHistory.get(volumeKey) || [];
    
    // SMART VOLUME: Combinar volume USD + trades count
    const smartVolume = volume + (tradesCount * 100); // Weight trades significativamente
    history.push(smartVolume);
    
    // Manter apenas últimos 15 valores para maior sensibilidade
    if (history.length > 15) {
      history.shift();
    }
    volumeHistory.set(volumeKey, history);

    // ULTRA-AGRESSIVO: Apenas 1 ponto de história para máxima velocidade
    if (history.length < 1) return null;

    const avgVolume = history.reduce((sum, v) => sum + v, 0) / history.length;
    const volumeSpike = smartVolume / (avgVolume || 1);

    // THRESHOLD ULTRA-AGRESSIVO: 1.05x base (dinâmico)
    let threshold = 1.05;
    
    // Threshold dinâmico baseado na volatilidade
    if (Math.abs(priceChange) > 5) threshold = 1.03; // Mais agressivo para high volatility
    if (Math.abs(priceChange) > 10) threshold = 1.01; // Extremamente agressivo para pumps
    if (isFuturesPriority) threshold *= 0.95; // 5% mais agressivo para futures priority
    
    if (volumeSpike < threshold) {
      console.log(`❌ ${ticker}: Spike ${volumeSpike.toFixed(2)}x < threshold ${threshold.toFixed(2)}x`);
      return null;
    }

    // FUTURES FOCUS: 70% peso para futures vs 30% spot
    let alertType: VolumeAlert['type'];
    if (Math.abs(priceChange) > 3 || isFuturesPriority) {
      // Priorizar futures para movements > 3% ou assets priority
      alertType = priceChange >= 0 ? 'futures_long' : 'futures_short';
    } else {
      alertType = priceChange >= 0 ? 'spot_buy' : 'spot_sell';
    }

    // SISTEMA DE FORÇA OTIMIZADO FUTURES
    let strength = 1;
    
    // Base strength por volume spike
    if (volumeSpike >= 3) strength = 5;
    else if (volumeSpike >= 2) strength = 4;
    else if (volumeSpike >= 1.5) strength = 3;
    else if (volumeSpike >= 1.2) strength = 2;
    else if (volumeSpike >= threshold) strength = 2;
    
    // Bonus por price movement
    if (Math.abs(priceChange) >= 5) strength = Math.min(5, strength + 2);
    else if (Math.abs(priceChange) >= 3) strength = Math.min(5, strength + 1);
    else if (Math.abs(priceChange) >= 1) strength = Math.min(5, strength + 1);
    
    // Bonus por trades count
    if (tradesCount > 200) strength = Math.min(5, strength + 1);
    else if (tradesCount > 100) strength = Math.min(5, strength + 1);
    
    // Bonus futures priority
    if (alertType.startsWith('futures_') && isFuturesPriority) {
      strength = Math.min(5, strength + 1);
    }

    // PUMP PATTERN DETECTION
    let pumpPattern = '';
    if (volumeSpike >= 3 && Math.abs(priceChange) >= 2) pumpPattern = '🚀 PUMP';
    if (volumeSpike >= 5) pumpPattern = '🔥 MASSIVE PUMP';
    if (Math.abs(priceChange) >= 10) pumpPattern = '⚡ PRICE EXPLOSION';

    console.log(`🚨 ALERT GERADO: ${ticker} - ${alertType.toUpperCase()} - Spike: ${volumeSpike.toFixed(2)}x | Price: ${priceChange.toFixed(2)}% | Força: ${strength} ${pumpPattern}`);

    return {
      id: `${ticker}-${mode}-${Date.now()}-${Math.random()}`,
      asset: ticker.replace('USDT', ''),
      ticker,
      type: alertType,
      volume: smartVolume,
      volumeSpike,
      price,
      priceMovement: priceChange,
      change24h: priceChange,
      timestamp: new Date(),
      strength,
      avgVolume
    };
  }, [volumeHistory, futuresPriorityAssets]);

  // Processar dados WebSocket em tempo real - otimizado
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    // Filtrar apenas dados novos para evitar reprocessamento
    const currentTimestamp = Date.now();
    if (currentTimestamp - lastProcessedTimestamp < 1000) return; // Throttle 1s
    
    setLastProcessedTimestamp(currentTimestamp);

    const newAlerts: VolumeAlert[] = [];
    
    console.log(`🌊 WEBSOCKET REAL-TIME: ${flowData.length} streams ativos | Status: ${connectionStatus}`);

    // PROCESSAR TODOS - SEM FILTROS RESTRITIVOS
    const recentData = flowData.filter(data => !data.isLiquidation);
    
    console.log(`🌊 ALTCOIN SEASON MODE: ${recentData.length}/${flowData.length} streams | Modo: ${currentMode.toUpperCase()}`);
    
    // COUNTERS para debug detalhado
    let processedCount = 0;
    let filteredCount = 0;
    let alertsGenerated = 0;
    let futuresProcessed = 0;
    let spotProcessed = 0;
    
    recentData.forEach(data => {
      processedCount++;
      
      // ZERO FILTROS - Aceitar tudo com ticker
      if (!data.ticker) {
        filteredCount++;
        return;
      }

      // SMART VOLUME - Sem mínimos
      const price = data.price || 1;
      const volume = data.volume || 0;
      const trades = data.trades_count || 0;
      const priceChange = data.change_24h || 0;
      
      // VOLUME INTELIGENTE: USD + Trades weight + Fallback
      let smartVolume = 0;
      if (volume > 0) {
        smartVolume = volume * price; // Volume USD
      }
      if (trades > 0) {
        smartVolume += trades * 150; // Trades weight increased
      }
      if (smartVolume === 0) {
        smartVolume = Math.abs(priceChange) * 1000; // Fallback baseado no movimento
      }

      // LOG DETALHADO por ticker
      const isFutures = futuresPriorityAssets.includes(data.ticker);
      if (isFutures) futuresProcessed++;
      else spotProcessed++;
      
      console.log(`⚡ ${data.ticker}: $${smartVolume.toFixed(0)} | ${priceChange.toFixed(2)}% | T:${trades} | ${isFutures ? 'FUTURES' : 'SPOT'}`);

      const alert = detectVolumeAnomaly(
        data.ticker,
        smartVolume,
        price,
        priceChange,
        currentMode,
        trades
      );

      if (alert) {
        newAlerts.push(alert);
        alertsGenerated++;
        console.log(`🚨 ${alertsGenerated}º ALERT: ${alert.type.toUpperCase()} - ${alert.asset} - ${alert.volumeSpike.toFixed(2)}x | ${alert.priceMovement.toFixed(2)}% | ⭐${alert.strength}`);
      }
    });

    // DEBUG SUMMARY
    console.log(`📊 PROCESSAMENTO COMPLETO:`);
    console.log(`├─ Total processados: ${processedCount}`);
    console.log(`├─ Filtrados (sem ticker): ${filteredCount}`);
    console.log(`├─ Futures processados: ${futuresProcessed}`);
    console.log(`├─ Spot processados: ${spotProcessed}`);
    console.log(`└─ 🚨 ALERTAS GERADOS: ${alertsGenerated}`);

    console.log(`📈 Real-time alertas: ${newAlerts.length} gerados`);

    // SISTEMA DE ALERTAS ALTCOIN SEASON OTIMIZADO
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        // Anti-spam reduzido para capturar mais movimentos: 15 segundos
        const now = new Date();
        const validPrev = prev.filter(alert => 
          (now.getTime() - alert.timestamp.getTime()) > 15000 || 
          !newAlerts.some(newAlert => newAlert.asset === alert.asset && newAlert.type === alert.type)
        );
        
        const combined = [...newAlerts, ...validPrev];
        
        // Priorizar futures e high strength
        const sorted = combined.sort((a, b) => {
          // Primeiro por strength
          if (a.strength !== b.strength) return b.strength - a.strength;
          // Depois por type (futures priority)
          const aFutures = a.type.startsWith('futures_') ? 1 : 0;
          const bFutures = b.type.startsWith('futures_') ? 1 : 0;
          if (aFutures !== bFutures) return bFutures - aFutures;
          // Por último por timestamp
          return b.timestamp.getTime() - a.timestamp.getTime();
        });
        
        return sorted.slice(0, 200); // Aumentado para 200 alertas
      });
      
      console.log(`🔄 ALERTS UPDATED: ${newAlerts.length} novos | Total: ${alerts.length + newAlerts.length}`);
    }
  }, [flowData, currentMode, detectVolumeAnomaly, lastProcessedTimestamp]);

  // LIMPEZA AUTOMÁTICA ALTCOIN SEASON
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      const before = alerts.length;
      
      setAlerts(prev => {
        const filtered = prev.filter(alert => 
          (now.getTime() - alert.timestamp.getTime()) < 15 * 60 * 1000 // 15 minutos para altcoin season
        );
        
        if (filtered.length !== before) {
          console.log(`🧹 CLEANUP: ${before - filtered.length} alertas expirados removidos`);
        }
        
        return filtered;
      });
    }, 45000); // Limpeza a cada 45 segundos (menos agressiva)

    return () => clearInterval(cleanup);
  }, [alerts.length]);

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