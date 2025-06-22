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
  marketCap: 'high' | 'mid' | 'low';
}

export const CoinTrendHunter: React.FC = () => {
  const { longLiquidations, shortLiquidations } = useSeparatedLiquidations();
  const { setSelectedAsset } = useTrading();
  const { saveCoinTrend } = useSupabaseStorage();
  const [uncommonLiquidations, setUncommonLiquidations] = useState<UncommonLiquidation[]>([]);

  useEffect(() => {
    const processLiquidations = () => {
      console.log('🔍 PROCESSANDO LIQUIDAÇÕES PARA COIN TREND HUNTER (LOW CAP APENAS)...');
      console.log(`📊 Long Liquidations: ${longLiquidations.length}`);
      console.log(`📊 Short Liquidations: ${shortLiquidations.length}`);
      
      const now = new Date();
      const newUncommonLiquidations: UncommonLiquidation[] = [];

      // Processar LONG liquidations - APENAS LOW CAP ($2K-$5K)
      longLiquidations.forEach(longAsset => {
        // FILTRO 1: Apenas LOW CAP
        if (longAsset.marketCap !== 'low') {
          return;
        }

        // FILTRO 2: Apenas liquidações entre $2K e $5K
        if (longAsset.longLiquidated < 2000 || longAsset.longLiquidated > 5000) {
          return;
        }

        // Calcular anomaly score para LONG
        let anomalyScore = 1;
        
        if (longAsset.longLiquidated >= 4500) anomalyScore += 3; // Próximo ao limite
        else if (longAsset.longLiquidated >= 3500) anomalyScore += 2;
        else if (longAsset.longLiquidated >= 2500) anomalyScore += 1;
        
        if (longAsset.intensity >= 4) anomalyScore += 2; // Bonus por intensidade
        if (longAsset.price < 0.01) anomalyScore += 2; // Micro penny coin
        
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
          dailyVolumeImpact: Math.min(100, (longAsset.longLiquidated / 50000) * 15),
          timestamp: new Date(longAsset.lastUpdateTime),
          change24h: -longAsset.volatility,
          isHidden: longAsset.price < 0.001,
          intensity: longAsset.intensity,
          marketCap: longAsset.marketCap
        };
        
        console.log(`🔴 LOW CAP LONG TREND: ${uncommonLiq.asset} - Score: ${uncommonLiq.anomalyScore}/10 - $${(uncommonLiq.amount/1000).toFixed(1)}K`);
        newUncommonLiquidations.push(uncommonLiq);
        
        // Salvar no Supabase com dados comprimidos
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
          volume: longAsset.longLiquidated / longAsset.price,
          is_hidden: uncommonLiq.isHidden,
          is_micro_cap: true // Sempre true para low cap
        });
      });

      // Processar SHORT liquidations - APENAS LOW CAP ($2K-$5K)
      shortLiquidations.forEach(shortAsset => {
        // FILTRO 1: Apenas LOW CAP
        if (shortAsset.marketCap !== 'low') {
          return;
        }

        // FILTRO 2: Apenas liquidações entre $2K e $5K
        if (shortAsset.shortLiquidated < 2000 || shortAsset.shortLiquidated > 5000) {
          return;
        }

        // Calcular anomaly score para SHORT
        let anomalyScore = 1;
        
        if (shortAsset.shortLiquidated >= 4500) anomalyScore += 3; // Próximo ao limite
        else if (shortAsset.shortLiquidated >= 3500) anomalyScore += 2;
        else if (shortAsset.shortLiquidated >= 2500) anomalyScore += 1;
        
        if (shortAsset.intensity >= 4) anomalyScore += 2; // Bonus por intensidade
        if (shortAsset.price < 0.01) anomalyScore += 2; // Micro penny coin
        
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
          dailyVolumeImpact: Math.min(100, (shortAsset.shortLiquidated / 50000) * 15),
          timestamp: new Date(shortAsset.lastUpdateTime),
          change24h: shortAsset.volatility,
          isHidden: shortAsset.price < 0.001,
          intensity: shortAsset.intensity,
          marketCap: shortAsset.marketCap
        };
        
        console.log(`🟢 LOW CAP SHORT TREND: ${uncommonLiq.asset} - Score: ${uncommonLiq.anomalyScore}/10 - $${(uncommonLiq.amount/1000).toFixed(1)}K`);
        newUncommonLiquidations.push(uncommonLiq);
        
        // Salvar no Supabase com dados comprimidos
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
          volume: shortAsset.shortLiquidated / shortAsset.price,
          is_hidden: uncommonLiq.isHidden,
          is_micro_cap: true // Sempre true para low cap
        });
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
            .slice(0, 20); // Reduzir para 20 para economizar dados
        });
        
        console.log(`✅ COIN TREND HUNTER: ${newUncommonLiquidations.length} liquidações LOW CAP processadas ($2K-$5K)`);
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
                Detectando liquidações LOW CAP ($2K-$5K) • Dados de liquidação reais separados
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Low-Caps</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-orange-600" />
              <span>$2K-$5K</span>
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
                  <TableHead className="w-20">Score</TableHead>
                  <TableHead className="w-20">Cap</TableHead>
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
                      <Badge className={getAnomalyColor(liquidation.anomalyScore)}>
                        {liquidation.anomalyScore}/10
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-800">
                        LOW
                      </Badge>
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
                <h4 className="text-lg font-medium text-gray-700">Caçando Low-Caps</h4>
                <p className="text-gray-500 text-sm max-w-md">
                  Aguardando liquidações LOW CAP entre $2K-$5K...
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
              <div className="text-gray-600">Long</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">
                {uncommonLiquidations.filter(l => l.type === 'short').length}
              </div>
              <div className="text-gray-600">Short</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">
                {uncommonLiquidations.filter(l => l.anomalyScore >= 7).length}
              </div>
              <div className="text-gray-600">High Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
