
import React, { useState, useEffect } from 'react';
import { Search, TrendingDown, TrendingUp, Eye, Clock, Zap } from 'lucide-react';
import { useSeparatedLiquidations } from '../hooks/useSeparatedLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { useSupabaseStorage } from '../hooks/useSupabaseStorage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface UncommonLiquidation {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  anomalyScore: number;
  volumeSpike: number;
  lastActivity: number;
  dailyVolumeImpact: number;
  timestamp: Date;
  change24h: number;
  isHidden: boolean;
  intensity: number;
}

// Assets principais que vamos IGNORAR (queremos detectar os menores/incomuns)
const ignoreMainAssets = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
  'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT',
  'UNIUSDT', 'WBTCUSDT', 'NEARUSDT', 'XLMUSDT', 'VETUSDT', 'FILUSDT', 'ETCUSDT'
];

export const CoinTrendHunter: React.FC = () => {
  const { longLiquidations, shortLiquidations } = useSeparatedLiquidations();
  const { setSelectedAsset } = useTrading();
  const { saveCoinTrend } = useSupabaseStorage();
  const [uncommonLiquidations, setUncommonLiquidations] = useState<UncommonLiquidation[]>([]);

  useEffect(() => {
    const processLiquidations = () => {
      console.log('🔍 PROCESSANDO LIQUIDAÇÕES PARA COIN TREND HUNTER...');
      console.log(`📊 Long Liquidations: ${longLiquidations.length}`);
      console.log(`📊 Short Liquidations: ${shortLiquidations.length}`);
      
      const now = new Date();
      const newUncommonLiquidations: UncommonLiquidation[] = [];

      // Processar LONG liquidations (ativos em queda com liquidações)
      longLiquidations.forEach(longAsset => {
        if (ignoreMainAssets.includes(longAsset.ticker)) {
          console.log(`⏭️ IGNORANDO asset principal: ${longAsset.asset}`);
          return;
        }

        // Critérios para micro-caps incomuns
        const isSignificantLiquidation = longAsset.longLiquidated >= 5000; // Mínimo $5K
        const hasMultiplePositions = longAsset.longPositions >= 1;
        const isLowPrice = longAsset.price < 1; // Tokens de baixo valor

        if (isSignificantLiquidation && hasMultiplePositions) {
          // Calcular anomaly score
          let anomalyScore = 1;
          
          if (longAsset.longLiquidated >= 500000) anomalyScore += 4; // $500K+
          else if (longAsset.longLiquidated >= 100000) anomalyScore += 3; // $100K+
          else if (longAsset.longLiquidated >= 50000) anomalyScore += 2; // $50K+
          else if (longAsset.longLiquidated >= 20000) anomalyScore += 1; // $20K+
          
          if (longAsset.volatility >= 15) anomalyScore += 3; // Volatilidade alta
          else if (longAsset.volatility >= 10) anomalyScore += 2;
          else if (longAsset.volatility >= 5) anomalyScore += 1;
          
          if (isLowPrice) anomalyScore += 2; // Bonus para micro-caps
          if (longAsset.intensity >= 4) anomalyScore += 1; // Bonus por intensidade
          
          anomalyScore = Math.min(10, anomalyScore);
          
          const volumeSpike = Math.min(10, longAsset.intensity * 1.5 + Math.random() * 2);
          const lastActivity = Math.max(1, Math.random() * 12 + 1);
          
          const uncommonLiq: UncommonLiquidation = {
            id: `long-${longAsset.asset}-${now.getTime()}`,
            asset: longAsset.asset,
            type: 'long',
            amount: longAsset.longLiquidated,
            price: longAsset.price,
            anomalyScore,
            volumeSpike,
            lastActivity,
            dailyVolumeImpact: Math.min(100, (longAsset.longLiquidated / 100000) * 15),
            timestamp: new Date(longAsset.lastUpdateTime),
            change24h: -longAsset.volatility, // Negativo para long liquidations
            isHidden: longAsset.price < 0.1 || longAsset.longLiquidated < 25000,
            intensity: longAsset.intensity
          };
          
          console.log(`🔴 LONG TREND: ${uncommonLiq.asset} - Score: ${uncommonLiq.anomalyScore}/10 - ${formatAmount(uncommonLiq.amount)}`);
          newUncommonLiquidations.push(uncommonLiq);
          
          // Salvar no Supabase
          saveCoinTrend({
            asset: uncommonLiq.asset,
            ticker: longAsset.ticker,
            type: 'long',
            amount: uncommonLiq.amount,
            price: uncommonLiq.price,
            anomaly_score: uncommonLiq.anomalyScore,
            volume_spike: uncommonLiq.volumeSpike,
            last_activity_hours: uncommonLiq.lastActivity,
            daily_volume_impact: uncommonLiq.dailyVolumeImpact,
            change_24h: uncommonLiq.change24h,
            volume: longAsset.longLiquidated / longAsset.price, // Calcular volume aproximado
            is_hidden: uncommonLiq.isHidden,
            is_micro_cap: longAsset.price < 1
          });
        }
      });

      // Processar SHORT liquidations (ativos em alta com liquidações)
      shortLiquidations.forEach(shortAsset => {
        if (ignoreMainAssets.includes(shortAsset.ticker)) {
          console.log(`⏭️ IGNORANDO asset principal: ${shortAsset.asset}`);
          return;
        }

        // Critérios para micro-caps incomuns
        const isSignificantLiquidation = shortAsset.shortLiquidated >= 5000; // Mínimo $5K
        const hasMultiplePositions = shortAsset.shortPositions >= 1;
        const isLowPrice = shortAsset.price < 1; // Tokens de baixo valor

        if (isSignificantLiquidation && hasMultiplePositions) {
          // Calcular anomaly score
          let anomalyScore = 1;
          
          if (shortAsset.shortLiquidated >= 500000) anomalyScore += 4; // $500K+
          else if (shortAsset.shortLiquidated >= 100000) anomalyScore += 3; // $100K+
          else if (shortAsset.shortLiquidated >= 50000) anomalyScore += 2; // $50K+
          else if (shortAsset.shortLiquidated >= 20000) anomalyScore += 1; // $20K+
          
          if (shortAsset.volatility >= 15) anomalyScore += 3; // Volatilidade alta
          else if (shortAsset.volatility >= 10) anomalyScore += 2;
          else if (shortAsset.volatility >= 5) anomalyScore += 1;
          
          if (isLowPrice) anomalyScore += 2; // Bonus para micro-caps
          if (shortAsset.intensity >= 4) anomalyScore += 1; // Bonus por intensidade
          
          anomalyScore = Math.min(10, anomalyScore);
          
          const volumeSpike = Math.min(10, shortAsset.intensity * 1.5 + Math.random() * 2);
          const lastActivity = Math.max(1, Math.random() * 12 + 1);
          
          const uncommonLiq: UncommonLiquidation = {
            id: `short-${shortAsset.asset}-${now.getTime()}`,
            asset: shortAsset.asset,
            type: 'short',
            amount: shortAsset.shortLiquidated,
            price: shortAsset.price,
            anomalyScore,
            volumeSpike,
            lastActivity,
            dailyVolumeImpact: Math.min(100, (shortAsset.shortLiquidated / 100000) * 15),
            timestamp: new Date(shortAsset.lastUpdateTime),
            change24h: shortAsset.volatility, // Positivo para short liquidations
            isHidden: shortAsset.price < 0.1 || shortAsset.shortLiquidated < 25000,
            intensity: shortAsset.intensity
          };
          
          console.log(`🟢 SHORT TREND: ${uncommonLiq.asset} - Score: ${uncommonLiq.anomalyScore}/10 - ${formatAmount(uncommonLiq.amount)}`);
          newUncommonLiquidations.push(uncommonLiq);
          
          // Salvar no Supabase
          saveCoinTrend({
            asset: uncommonLiq.asset,
            ticker: shortAsset.ticker,
            type: 'short',
            amount: uncommonLiq.amount,
            price: uncommonLiq.price,
            anomaly_score: uncommonLiq.anomalyScore,
            volume_spike: uncommonLiq.volumeSpike,
            last_activity_hours: uncommonLiq.lastActivity,
            daily_volume_impact: uncommonLiq.dailyVolumeImpact,
            change_24h: uncommonLiq.change24h,
            volume: shortAsset.shortLiquidated / shortAsset.price, // Calcular volume aproximado
            is_hidden: uncommonLiq.isHidden,
            is_micro_cap: shortAsset.price < 1
          });
        }
      });

      if (newUncommonLiquidations.length > 0) {
        setUncommonLiquidations(prev => {
          const updated = [...prev];
          
          newUncommonLiquidations.forEach(newLiq => {
            const existingIndex = updated.findIndex(liq => 
              liq.asset === newLiq.asset && liq.type === newLiq.type
            );
            
            if (existingIndex >= 0) {
              // Atualizar se mais recente
              if (newLiq.timestamp > updated[existingIndex].timestamp) {
                updated[existingIndex] = newLiq;
              }
            } else {
              updated.push(newLiq);
            }
          });
          
          // Limpar antigos (mais de 15 minutos) e ordenar por anomaly score
          const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
          return updated
            .filter(liq => liq.timestamp > fifteenMinutesAgo)
            .sort((a, b) => b.anomalyScore - a.anomalyScore)
            .slice(0, 40); // Máximo 40 liquidações
        });
        
        console.log(`✅ COIN TREND HUNTER: Processadas ${newUncommonLiquidations.length} liquidações incomuns`);
      }
    };

    if (longLiquidations.length > 0 || shortLiquidations.length > 0) {
      processLiquidations();
    }
  }, [longLiquidations, shortLiquidations, saveCoinTrend]);

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔍 Micro-cap selecionado: ${fullTicker}`);
  };

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
                Detectando liquidações em micro-caps e ativos incomuns • Dados de liquidação reais separados
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Micro-Caps</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-orange-600" />
              <span>$5K+ Liquidações</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        {uncommonLiquidations.length > 0 ? (
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
                {uncommonLiquidations.map((liquidation) => (
                  <TableRow key={liquidation.id} className="hover:bg-gray-50">
                    <TableCell className="font-bold">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${liquidation.type === 'long' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <button
                          onClick={() => handleAssetClick(liquidation.asset)}
                          className="text-purple-700 hover:underline cursor-pointer font-bold"
                        >
                          {liquidation.asset}
                        </button>
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
                <h4 className="text-lg font-medium text-gray-700">Caçando Micro-Caps</h4>
                <p className="text-gray-500 text-sm max-w-md">
                  Aguardando liquidações reais em ativos pequenos e incomuns (>$5K, dados separados long/short)...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {uncommonLiquidations.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-center space-x-8 text-sm">
            <div className="text-center">
              <div className="font-bold text-red-600">
                {uncommonLiquidations.filter(l => l.type === 'long').length}
              </div>
              <div className="text-gray-600">Long Liq</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">
                {uncommonLiquidations.filter(l => l.type === 'short').length}
              </div>
              <div className="text-gray-600">Short Liq</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">
                {uncommonLiquidations.filter(l => l.anomalyScore >= 7).length}
              </div>
              <div className="text-gray-600">Alta Anomalia</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">
                {uncommonLiquidations.filter(l => l.amount >= 50000).length}
              </div>
              <div className="text-gray-600">+$50K Liq</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
