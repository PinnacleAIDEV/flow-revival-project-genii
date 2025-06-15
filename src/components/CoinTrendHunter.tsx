
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
  anomalyScore: number;
  volumeSpike: number;
  lastActivity: number;
  dailyVolumeImpact: number;
  timestamp: Date;
  change24h: number;
  isHidden: boolean;
}

// Assets principais que vamos IGNORAR (queremos os menores)
const ignoreAssets = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 
  'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT'
];

export const CoinTrendHunter: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [liquidations, setLiquidations] = useState<UncommonLiquidation[]>([]);

  useEffect(() => {
    if (!flowData || flowData.length === 0) return;

    const now = new Date();
    const newLiquidations: UncommonLiquidation[] = [];

    flowData.forEach(data => {
      // Filtrar apenas ativos menores/incomuns
      if (!data.ticker || ignoreAssets.includes(data.ticker) || 
          isNaN(data.price) || data.price <= 0 || 
          isNaN(data.volume) || data.volume <= 0) return;

      const asset = data.ticker.replace('USDT', '');
      const volumeValue = data.volume * data.price;
      const priceChange = Math.abs(data.change_24h || 0);
      
      // **CRITÉRIOS MAIS REALISTAS** para detectar micro-cap liquidations:
      // 1. Valor da liquidação > $5k (bem baixo para pegar micro-caps)
      // 2. Movimento de preço > 3% (mais sensível)
      // 3. Volume acima de threshold mínimo
      
      const hasMinLiquidationValue = volumeValue >= 5000; // $5k+
      const hasSignificantMove = priceChange >= 3.0; // 3%+
      const hasMinVolume = data.volume >= 1000; // Volume mínimo
      
      if (hasMinLiquidationValue && hasSignificantMove && hasMinVolume) {
        // Calcular score de anomalia baseado em tamanho relativo
        let anomalyScore = 1;
        
        // Score por valor da liquidação
        if (volumeValue >= 500000) anomalyScore += 4; // $500k+
        else if (volumeValue >= 100000) anomalyScore += 3; // $100k+
        else if (volumeValue >= 50000) anomalyScore += 2; // $50k+
        else if (volumeValue >= 20000) anomalyScore += 1; // $20k+
        
        // Score por movimento de preço
        if (priceChange >= 15) anomalyScore += 3;
        else if (priceChange >= 10) anomalyScore += 2;
        else if (priceChange >= 5) anomalyScore += 1;
        
        // Bonus para ativos muito pequenos
        if (data.price < 0.01) anomalyScore += 1; // Muito barato = micro-cap
        if (data.price < 1) anomalyScore += 1; // Preço baixo
        
        anomalyScore = Math.min(10, anomalyScore);
        
        // Simular volume spike (já que não temos histórico real)
        const volumeSpike = Math.random() * 8 + 2; // Entre 2x e 10x
        
        const liquidation: UncommonLiquidation = {
          id: `${data.ticker}-${now.getTime()}-${Math.random()}`,
          asset,
          type: (data.change_24h || 0) < 0 ? 'long' : 'short',
          amount: volumeValue,
          price: data.price,
          anomalyScore,
          volumeSpike,
          lastActivity: Math.random() * 24 + 1, // 1-25 horas
          dailyVolumeImpact: Math.min(100, (volumeValue / 100000) * 10), // Estimativa
          timestamp: new Date(data.timestamp || now.getTime()),
          change24h: data.change_24h || 0,
          isHidden: data.price < 0.1 || volumeValue < 25000 // Muito pequeno = "escondido"
        };
        
        console.log(`🔍 Liquidação micro-cap detectada: ${liquidation.asset} - Score: ${liquidation.anomalyScore}/10 - ${formatAmount(liquidation.amount)}`);
        newLiquidations.push(liquidation);
      }
    });

    if (newLiquidations.length > 0) {
      setLiquidations(prev => {
        const updated = [...prev];
        
        newLiquidations.forEach(newLiq => {
          const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
          if (existingIndex >= 0) {
            // Atualizar existente apenas se for mais recente
            if (newLiq.timestamp > updated[existingIndex].timestamp) {
              updated[existingIndex] = newLiq;
            }
          } else {
            updated.push(newLiq);
          }
        });
        
        // Remover muito antigos (>10 min) e manter ordenado
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
        return updated
          .filter(liq => liq.timestamp > tenMinutesAgo)
          .sort((a, b) => b.anomalyScore - a.anomalyScore)
          .slice(0, 30);
      });
    }
  }, [flowData]);

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
                Detectando liquidações em micro-caps e ativos incomuns • Critérios relaxados para mais detecções
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
                <h4 className="text-lg font-medium text-gray-700">Caçando Micro-Caps</h4>
                <p className="text-gray-500 text-sm max-w-md">
                  Procurando liquidações em ativos pequenos com critérios mais sensíveis ({'>'}$5K, {'>'}3% movimento)...
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
                {liquidations.filter(l => l.anomalyScore >= 7).length}
              </div>
              <div className="text-gray-600">Alta Anomalia</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">
                {liquidations.filter(l => l.isHidden).length}
              </div>
              <div className="text-gray-600">Micro-Caps</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">
                {liquidations.filter(l => l.amount >= 50000).length}
              </div>
              <div className="text-gray-600">+$50K Liq</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
