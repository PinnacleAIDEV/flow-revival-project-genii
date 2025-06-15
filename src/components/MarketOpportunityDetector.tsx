
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Clock, DollarSign } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface MarketOpportunity {
  id: string;
  asset: string;
  type: 'momentum_breakout' | 'volume_surge' | 'reversal_signal' | 'accumulation_zone';
  confidence: number; // 1-5
  timeframe: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_reward_ratio: number;
  volume_analysis: {
    current_volume: number;
    avg_volume: number;
    volume_spike: number;
  };
  price_analysis: {
    support_level: number;
    resistance_level: number;
    trend_direction: 'bullish' | 'bearish' | 'sideways';
  };
  market_context: {
    market_cap_tier: 'large' | 'mid' | 'small';
    volatility_level: 'low' | 'medium' | 'high';
    liquidity_score: number;
  };
  timestamp: Date;
  last_update: Date;
}

const highMarketCapAssets = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 
  'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT'
];

export const MarketOpportunityDetector: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [priceHistory, setPriceHistory] = useState<Map<string, number[]>>(new Map());
  const [volumeHistory, setVolumeHistory] = useState<Map<string, number[]>>(new Map());

  // Detectar oportunidades baseadas em padrões mais confiáveis
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const newOpportunities: MarketOpportunity[] = [];
    const now = new Date();

    flowData.forEach(data => {
      if (!data.ticker || isNaN(data.price) || data.price <= 0) return;

      const asset = data.ticker.replace('USDT', '');
      const isLargeCap = highMarketCapAssets.includes(data.ticker);
      
      // Atualizar históricos
      updatePriceHistory(data.ticker, data.price);
      updateVolumeHistory(data.ticker, data.volume);

      const prices = priceHistory.get(data.ticker) || [];
      const volumes = volumeHistory.get(data.ticker) || [];

      if (prices.length < 10 || volumes.length < 10) return;

      // 1. MOMENTUM BREAKOUT - Alta confiança
      const breakoutSignal = detectMomentumBreakout(data, prices, volumes, isLargeCap);
      if (breakoutSignal) {
        newOpportunities.push(createOpportunity(
          data, 'momentum_breakout', breakoutSignal.confidence, breakoutSignal, now
        ));
      }

      // 2. VOLUME SURGE com confirmação de preço
      const volumeSignal = detectVolumeWithMomentum(data, prices, volumes, isLargeCap);
      if (volumeSignal) {
        newOpportunities.push(createOpportunity(
          data, 'volume_surge', volumeSignal.confidence, volumeSignal, now
        ));
      }

      // 3. REVERSÃO em suporte/resistência
      const reversalSignal = detectReversalPattern(data, prices, volumes, isLargeCap);
      if (reversalSignal) {
        newOpportunities.push(createOpportunity(
          data, 'reversal_signal', reversalSignal.confidence, reversalSignal, now
        ));
      }
    });

    if (newOpportunities.length > 0) {
      setOpportunities(prev => {
        const updated = [...prev];
        
        newOpportunities.forEach(newOpp => {
          const existingIndex = updated.findIndex(opp => opp.asset === newOpp.asset && opp.type === newOpp.type);
          if (existingIndex >= 0) {
            updated[existingIndex] = { ...newOpp, last_update: now };
          } else {
            updated.push(newOpp);
          }
        });
        
        // Manter apenas oportunidades recentes e ordenar por confiança
        return updated
          .filter(opp => now.getTime() - opp.last_update.getTime() < 30 * 60 * 1000) // 30 min
          .sort((a, b) => {
            // Priorizar: confiança > risk/reward > market cap
            if (a.confidence !== b.confidence) return b.confidence - a.confidence;
            if (a.risk_reward_ratio !== b.risk_reward_ratio) return b.risk_reward_ratio - a.risk_reward_ratio;
            return a.market_context.market_cap_tier === 'large' ? -1 : 1;
          })
          .slice(0, 20);
      });
    }
  }, [flowData]);

  const updatePriceHistory = (ticker: string, price: number) => {
    setPriceHistory(prev => {
      const history = prev.get(ticker) || [];
      history.push(price);
      if (history.length > 50) history.shift();
      const newMap = new Map(prev);
      newMap.set(ticker, history);
      return newMap;
    });
  };

  const updateVolumeHistory = (ticker: string, volume: number) => {
    setVolumeHistory(prev => {
      const history = prev.get(ticker) || [];
      history.push(volume);
      if (history.length > 50) history.shift();
      const newMap = new Map(prev);
      newMap.set(ticker, history);
      return newMap;
    });
  };

  const detectMomentumBreakout = (data: any, prices: number[], volumes: number[], isLargeCap: boolean) => {
    if (prices.length < 20) return null;

    const currentPrice = data.price;
    const recentPrices = prices.slice(-10);
    const olderPrices = prices.slice(-20, -10);
    
    const recentHigh = Math.max(...recentPrices);
    const recentLow = Math.min(...recentPrices);
    const resistance = Math.max(...olderPrices);
    
    const avgVolume = volumes.slice(-10).reduce((sum, v) => sum + v, 0) / 10;
    const currentVolume = data.volume;
    const volumeConfirmation = currentVolume > avgVolume * (isLargeCap ? 2.5 : 3.0);
    
    const priceBreakout = currentPrice > resistance * 1.02; // 2% acima da resistência
    const momentumStrong = Math.abs(data.change_24h) > (isLargeCap ? 5 : 8);
    
    if (priceBreakout && volumeConfirmation && momentumStrong) {
      const confidence = calculateConfidence([priceBreakout, volumeConfirmation, momentumStrong]);
      return {
        confidence,
        entry_price: currentPrice,
        target_price: currentPrice * 1.15, // 15% target
        stop_loss: recentLow * 0.98,
        support_level: recentLow,
        resistance_level: resistance
      };
    }
    
    return null;
  };

  const detectVolumeWithMomentum = (data: any, prices: number[], volumes: number[], isLargeCap: boolean) => {
    if (volumes.length < 15) return null;

    const avgVolume = volumes.slice(-15, -1).reduce((sum, v) => sum + v, 0) / 14;
    const volumeSpike = data.volume / avgVolume;
    const priceMove = Math.abs(data.change_24h);
    
    const thresholds = isLargeCap ? 
      { volume: 4.0, price: 3.0 } : 
      { volume: 5.0, price: 5.0 };
    
    if (volumeSpike > thresholds.volume && priceMove > thresholds.price) {
      const confidence = Math.min(5, Math.floor(volumeSpike / 2) + Math.floor(priceMove / 2));
      return {
        confidence,
        entry_price: data.price,
        target_price: data.price * (data.change_24h > 0 ? 1.12 : 0.88),
        stop_loss: data.price * (data.change_24h > 0 ? 0.95 : 1.05),
        volume_spike: volumeSpike
      };
    }
    
    return null;
  };

  const detectReversalPattern = (data: any, prices: number[], volumes: number[], isLargeCap: boolean) => {
    if (prices.length < 20) return null;

    const currentPrice = data.price;
    const support = Math.min(...prices.slice(-20));
    const resistance = Math.max(...prices.slice(-20));
    const range = resistance - support;
    
    const nearSupport = Math.abs(currentPrice - support) < range * 0.05;
    const nearResistance = Math.abs(currentPrice - resistance) < range * 0.05;
    const volumeIncrease = data.volume > volumes.slice(-10).reduce((sum, v) => sum + v, 0) / 10 * 2;
    
    if ((nearSupport || nearResistance) && volumeIncrease) {
      const confidence = nearSupport ? 4 : 3; // Reversão de suporte mais confiável
      return {
        confidence,
        entry_price: currentPrice,
        target_price: nearSupport ? (support + range * 0.6) : (resistance - range * 0.6),
        stop_loss: nearSupport ? support * 0.98 : resistance * 1.02,
        support_level: support,
        resistance_level: resistance
      };
    }
    
    return null;
  };

  const calculateConfidence = (signals: boolean[]): number => {
    return Math.min(5, signals.filter(Boolean).length + 1);
  };

  const createOpportunity = (data: any, type: MarketOpportunity['type'], confidence: number, signal: any, timestamp: Date): MarketOpportunity => {
    const isLargeCap = highMarketCapAssets.includes(data.ticker);
    const riskReward = Math.abs(signal.target_price - signal.entry_price) / Math.abs(signal.entry_price - signal.stop_loss);
    
    return {
      id: `${data.ticker}-${type}-${timestamp.getTime()}`,
      asset: data.ticker.replace('USDT', ''),
      type,
      confidence,
      timeframe: '15m',
      entry_price: signal.entry_price,
      target_price: signal.target_price,
      stop_loss: signal.stop_loss,
      risk_reward_ratio: Math.round(riskReward * 100) / 100,
      volume_analysis: {
        current_volume: data.volume,
        avg_volume: signal.avg_volume || data.volume,
        volume_spike: signal.volume_spike || 1
      },
      price_analysis: {
        support_level: signal.support_level || data.price * 0.95,
        resistance_level: signal.resistance_level || data.price * 1.05,
        trend_direction: data.change_24h > 2 ? 'bullish' : data.change_24h < -2 ? 'bearish' : 'sideways'
      },
      market_context: {
        market_cap_tier: isLargeCap ? 'large' : 'small',
        volatility_level: Math.abs(data.change_24h) > 10 ? 'high' : Math.abs(data.change_24h) > 5 ? 'medium' : 'low',
        liquidity_score: isLargeCap ? 9 : 6
      },
      timestamp,
      last_update: timestamp
    };
  };

  const getTypeColor = (type: MarketOpportunity['type']) => {
    const colors = {
      momentum_breakout: 'bg-green-100 text-green-800',
      volume_surge: 'bg-blue-100 text-blue-800',
      reversal_signal: 'bg-purple-100 text-purple-800',
      accumulation_zone: 'bg-orange-100 text-orange-800'
    };
    return colors[type];
  };

  const getTypeLabel = (type: MarketOpportunity['type']) => {
    const labels = {
      momentum_breakout: 'Breakout',
      volume_surge: 'Volume Surge',
      reversal_signal: 'Reversal',
      accumulation_zone: 'Accumulation'
    };
    return labels[type];
  };

  const formatPrice = (price: number) => price >= 1 ? `$${price.toFixed(4)}` : `$${price.toFixed(6)}`;
  const formatChange = (price1: number, price2: number) => {
    const change = ((price1 - price2) / price2) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Market Opportunities</h2>
              <p className="text-sm text-gray-500">
                Sinais baseados em momentum, volume e reversões • Ordenado por confiança
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {opportunities.length} oportunidades ativas
          </div>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="flex-1 p-4 min-h-0">
        {opportunities.length > 0 ? (
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-20">Asset</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-16">Conf</TableHead>
                  <TableHead className="w-24">Entry</TableHead>
                  <TableHead className="w-24">Target</TableHead>
                  <TableHead className="w-24">Stop</TableHead>
                  <TableHead className="w-20">R:R</TableHead>
                  <TableHead className="w-20">Cap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => (
                  <TableRow key={opp.id} className="hover:bg-gray-50">
                    <TableCell className="font-bold">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          opp.price_analysis.trend_direction === 'bullish' ? 'bg-green-500' : 
                          opp.price_analysis.trend_direction === 'bearish' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span>{opp.asset}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(opp.type)}>
                        {getTypeLabel(opp.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full mr-1 ${
                              i < opp.confidence ? 'bg-yellow-400' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatPrice(opp.entry_price)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex flex-col">
                        <span>{formatPrice(opp.target_price)}</span>
                        <span className="text-xs text-green-600">
                          {formatChange(opp.target_price, opp.entry_price)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex flex-col">
                        <span>{formatPrice(opp.stop_loss)}</span>
                        <span className="text-xs text-red-600">
                          {formatChange(opp.stop_loss, opp.entry_price)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      <span className={opp.risk_reward_ratio >= 2 ? 'text-green-600' : 'text-orange-600'}>
                        1:{opp.risk_reward_ratio}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={opp.market_context.market_cap_tier === 'large' ? 'default' : 'secondary'}>
                        {opp.market_context.market_cap_tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-4">
              <Target className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <h4 className="text-lg font-medium text-gray-700">Scanning for Opportunities</h4>
                <p className="text-gray-500 text-sm max-w-md">
                  Analisando padrões de momentum, volume e reversões para identificar as melhores oportunidades de mercado...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {opportunities.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-center space-x-8 text-sm">
            <div className="text-center">
              <div className="font-bold text-green-600">
                {opportunities.filter(o => o.confidence >= 4).length}
              </div>
              <div className="text-gray-600">Alta Confiança</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600">
                {opportunities.filter(o => o.risk_reward_ratio >= 2).length}
              </div>
              <div className="text-gray-600">R:R ≥ 2:1</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">
                {opportunities.filter(o => o.market_context.market_cap_tier === 'large').length}
              </div>
              <div className="text-gray-600">Large Cap</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
