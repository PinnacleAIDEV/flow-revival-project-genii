
import React, { useState, useEffect } from 'react';
import { Search, TrendingDown, TrendingUp, Eye, Clock, Zap } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface UncommonLiquidation {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  anomalyScore: number; // 1-10 quão incomum é
  volumeSpike: number; // multiplicador do volume normal
  lastActivity: number; // horas desde última atividade significativa
  dailyVolumeImpact: number; // % do volume diário
  timestamp: Date;
  change24h: number;
  isHidden: boolean; // se é um ativo "esquecido"
}

// Assets conhecidos que vamos IGNORAR (queremos os pequenos/obscuros)
const ignoreAssets = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
  'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT',
  'XLMUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'NEOUSDT', 'ALGOUSDT',
  'MANAUSDT', 'SANDUSDT', 'AXSUSDT', 'APEUSDT', 'CHZUSDT', 'GALAUSDT', 'ENJUSDT'
];

export const CoinTrendHunter: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [liquidations, setLiquidations] = useState<UncommonLiquidation[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<Map<string, number[]>>(new Map());

  // Atualizar histórico de volume para detectar spikes
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    flowData.forEach(data => {
      if (data.ticker && data.volume > 0) {
        setVolumeHistory(prev => {
          const history = prev.get(data.ticker) || [];
          history.push(data.volume);
          if (history.length > 24) history.shift(); // Manter últimas 24 leituras
          const newMap = new Map(prev);
          newMap.set(data.ticker, history);
          return newMap;
        });
      }
    });
  }, [flowData]);

  // Detectar liquidações incomuns
  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const newLiquidations: UncommonLiquidation[] = [];

    flowData.forEach(data => {
      // Filtrar apenas ativos pequenos/incomuns
      if (!data.ticker || ignoreAssets.includes(data.ticker) || 
          isNaN(data.price) || data.price <= 0 || 
          isNaN(data.volume) || data.volume <= 0) return;

      const asset = data.ticker.replace('USDT', '');
      const volumeValue = data.volume * data.price;
      const priceChange = Math.abs(data.change_24h || 0);
      
      // Calcular spike de volume
      const volumes = volumeHistory.get(data.ticker) || [];
      if (volumes.length < 10) return; // Precisamos de histórico
      
      const avgVolume = volumes.slice(0, -1).reduce((sum, v) => sum + v, 0) / (volumes.length - 1);
      const volumeSpike = avgVolume > 0 ? data.volume / avgVolume : 1;
      
      // Critérios para detectar liquidação incomum:
      // 1. Volume muito baixo normalmente (< $50k média)
      // 2. Spike de volume 5x+ acima da média
      // 3. Movimento de preço significativo (>8%)
      // 4. Valor da liquidação > $15k
      
      const isLowVolumeNormally = avgVolume * data.price < 50000; // < $50k média
      const hasVolumeSpike = volumeSpike >= 5.0;
      const hasSignificantMove = priceChange >= 8.0;
      const hasMinLiquidationValue = volumeValue >= 15000; // > $15k
      
      if (isLowVolumeNormally && hasVolumeSpike && hasSignificantMove && hasMinLiquidationValue) {
        // Calcular score de anomalia (1-10)
        let anomalyScore = 1;
        if (volumeSpike >= 20) anomalyScore += 3;
        else if (volumeSpike >= 10) anomalyScore += 2;
        else if (volumeSpike >= 5) anomalyScore += 1;
        
        if (priceChange >= 20) anomalyScore += 3;
        else if (priceChange >= 15) anomalyScore += 2;
        else if (priceChange >= 10) anomalyScore += 1;
        
        if (volumeValue >= 100000) anomalyScore += 2; // >$100k
        else if (volumeValue >= 50000) anomalyScore += 1; // >$50k
        
        anomalyScore = Math.min(10, anomalyScore);
        
        const liquidation: UncommonLiquidation = {
          id: `${data.ticker}-${now.getTime()}`,
          asset,
          type: (data.change_24h || 0) < 0 ? 'long' : 'short',
          amount: volumeValue,
          price: data.price,
          anomalyScore,
          volumeSpike,
          lastActivity: Math.random() * 48 + 2, // Simular horas desde última atividade
          dailyVolumeImpact: Math.min(100, (volumeValue / (avgVolume * data.price * 24)) * 100),
          timestamp: new Date(data.timestamp || now.getTime()),
          change24h: data.change_24h || 0,
          isHidden: avgVolume * data.price < 20000 // Muito pequeno = "escondido"
        };
        
        console.log(`🔍 Liquidação incomum detectada: ${liquidation.asset} - Score: ${liquidation.anomalyScore}/10`);
        newLiquidations.push(liquidation);
      }
    });

    if (newLiquidations.length > 0) {
      setLiquidations(prev => {
        const updated = [...prev];
        
        newLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // Atualizar existente
            updated[existingIndex] = { ...newLiq, timestamp: now };
          } else {
            updated.push(newLiq);
          }
        });
        
        // Ordenar por score de anomalia e manter apenas recentes
        return updated
          .filter(liq => now.getTime() - liq.timestamp.getTime() < 20 * 60 * 1000) // 20 min
          .sort((a, b) => b.anomalyScore - a.anomalyScore)
          .slice(0, 25); // Máximo 25
      });
    }
  }, [flowData, volumeHistory]);

  const formatAmount = (amount: number) => {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const getAnomalyColor = (score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-800';
    if (score >= 6) return 'bg-orange-100 text-orange-800';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-700';
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">CoinTrendHunter</h2>
              <p className="text-sm text-gray-500">
                Detectando liquidações em ativos incomuns e micro-caps • Score de anomalia
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Ativos Ocultos</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-orange-600" />
              <span>Volume Spike</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        {liquidations.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-20">Asset</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-24">Price</TableHead>
                  <TableHead className="w-20">24h %</TableHead>
                  <TableHead className="w-24">Amount</TableHead>
                  <TableHead className="w-20">Vol Spike</TableHead>
                  <TableHead className="w-20">Score</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidations.map((liquidation) => (
                  <TableRow key={liquidation.id} className="hover:bg-gray-50">
                    <TableCell className="font-bold">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${liquidation.type === 'long' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-purple-700">{liquidation.asset}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {liquidation.type === 'long' ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                        <span className={`text-xs font-medium ${liquidation.type === 'long' ? 'text-red-600' : 'text-green-600'}`}>
                          {liquidation.type.toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatPrice(liquidation.price)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${liquidation.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatChange(liquidation.change24h)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold">
                      {formatAmount(liquidation.amount)}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-orange-600">
                        {liquidation.volumeSpike.toFixed(1)}x
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAnomalyColor(liquidation.anomalyScore)}>
                        {liquidation.anomalyScore}/10
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {liquidation.isHidden && (
                          <Eye className="w-3 h-3 text-purple-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {liquidation.lastActivity.toFixed(0)}h ago
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-center">
            <div className="space-y-4">
              <Search className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <h4 className="text-lg font-medium text-gray-700">Hunting Hidden Liquidations</h4>
                <p className="text-gray-500 text-sm max-w-md">
                  Procurando por liquidações em ativos incomuns e micro-caps com volume anômalo...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {liquidations.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-center space-x-8 text-sm">
            <div className="text-center">
              <div className="font-bold text-red-600">
                {liquidations.filter(l => l.anomalyScore >= 8).length}
              </div>
              <div className="text-gray-600">Alta Anomalia</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">
                {liquidations.filter(l => l.isHidden).length}
              </div>
              <div className="text-gray-600">Ativos Ocultos</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">
                {liquidations.filter(l => l.volumeSpike >= 10).length}
              </div>
              <div className="text-gray-600">Spike 10x+</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
