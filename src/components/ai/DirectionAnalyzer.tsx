
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useRealFlowData } from '../../hooks/useRealFlowData';

interface DirectionSignal {
  id: string;
  asset: string;
  type: 'liquidation' | 'unusual_volume';
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 1-10
  confidence: number; // 0-100%
  reasoning: string;
  timestamp: Date;
  price: number;
  volume: number;
}

export const DirectionAnalyzer: React.FC = () => {
  const { flowData, alerts } = useRealFlowData();
  const [directionSignals, setDirectionSignals] = useState<DirectionSignal[]>([]);

  const analyzeDirection = (data: any, type: 'liquidation' | 'unusual_volume'): DirectionSignal | null => {
    const priceChange = data.change_24h || 0;
    const volumeValue = data.volume * data.price;
    
    // Análise de direção baseada em múltiplos fatores
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength = 1;
    let confidence = 50;
    let reasoning = '';

    // Análise para Liquidações
    if (type === 'liquidation') {
      if (Math.abs(priceChange) > 5 && volumeValue > 1000000) {
        direction = priceChange > 0 ? 'bullish' : 'bearish';
        strength = Math.min(10, Math.floor(Math.abs(priceChange) / 2));
        confidence = Math.min(95, 60 + (volumeValue / 100000));
        reasoning = `${direction === 'bullish' ? 'Short squeeze' : 'Long liquidation'} detectada com ${Math.abs(priceChange).toFixed(2)}% de movimento`;
      }
    }
    
    // Análise para Volume Anormal
    if (type === 'unusual_volume') {
      const volumeSpike = data.volumeSpike || 1;
      if (volumeSpike > 3) {
        if (Math.abs(priceChange) > 2) {
          direction = priceChange > 0 ? 'bullish' : 'bearish';
          strength = Math.min(10, Math.floor(volumeSpike));
          confidence = Math.min(90, 50 + (volumeSpike * 10));
          reasoning = `Volume spike de ${volumeSpike.toFixed(1)}x com direção ${direction === 'bullish' ? 'alta' : 'baixa'}`;
        } else {
          direction = 'neutral';
          reasoning = `Volume spike de ${volumeSpike.toFixed(1)}x sem direção clara de preço`;
        }
      }
    }

    if (strength > 3) {
      return {
        id: `${data.ticker}-${type}-${Date.now()}`,
        asset: data.ticker?.replace('USDT', '') || data.asset,
        type,
        direction,
        strength,
        confidence,
        reasoning,
        timestamp: new Date(),
        price: data.price,
        volume: volumeValue
      };
    }

    return null;
  };

  useEffect(() => {
    // Analisar dados de flow para unusual volume
    flowData.forEach(data => {
      const signal = analyzeDirection(data, 'unusual_volume');
      if (signal) {
        setDirectionSignals(prev => {
          const exists = prev.some(s => s.id === signal.id);
          if (!exists) {
            return [signal, ...prev.slice(0, 49)];
          }
          return prev;
        });
      }
    });

    // Analisar alertas para liquidações
    alerts.forEach(alert => {
      if (alert.type === 'liquidation') {
        const signal = analyzeDirection(alert, 'liquidation');
        if (signal) {
          setDirectionSignals(prev => {
            const exists = prev.some(s => s.id === signal.id);
            if (!exists) {
              return [signal, ...prev.slice(0, 49)];
            }
            return prev;
          });
        }
      }
    });
  }, [flowData, alerts]);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 8) return 'text-red-600 bg-red-100';
    if (strength >= 6) return 'text-orange-600 bg-orange-100';
    if (strength >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <Card className="h-full bg-[#1C1C1E] border-[#2E2E2E]">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
          <AlertTriangle className="w-5 h-5 text-[#00E0FF]" />
          <span>DIRECTION ANALYZER</span>
          <Badge className="bg-[#00E0FF]/20 text-[#00E0FF]">
            {directionSignals.length} signals
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {directionSignals.length > 0 ? directionSignals.map((signal) => (
          <div key={signal.id} className="p-3 bg-[#0A0A0A] rounded border border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getDirectionIcon(signal.direction)}
                <span className="font-bold text-[#F5F5F5]">{signal.asset}</span>
                <Badge variant="outline" className="text-xs">
                  {signal.type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`${getStrengthColor(signal.strength)} text-xs`}>
                  Força: {signal.strength}/10
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {signal.confidence}%
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-[#AAAAAA] mb-2">{signal.reasoning}</p>
            
            <div className="flex justify-between text-xs text-[#888888]">
              <span>${signal.price.toFixed(4)}</span>
              <span>Vol: ${(signal.volume / 1000).toFixed(0)}K</span>
              <span>{signal.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-[#AAAAAA]">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#00E0FF]/50" />
            <p>Analisando direções de mercado...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
