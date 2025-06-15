import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number;
  change24h: number;
  volume: number;
  lastUpdateTime: Date;
  totalLiquidated: number; // Valor total liquidado acumulado
}

export const LiquidationBubbleMap: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [longLiquidations, setLongLiquidations] = useState<LiquidationBubble[]>([]);
  const [shortLiquidations, setShortLiquidations] = useState<LiquidationBubble[]>([]);

  // TODOS os pares USDT principais da Binance - 500+ ativos
  const allBinanceAssets = [
    // Giants (Top 10)
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT',
    
    // Large Caps (Top 11-50)
    'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'NEOUSDT',
    'ALGOUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT', 'APEUSDT', 'CHZUSDT', 'GALAUSDT', 'ENJUSDT', 'NEARUSDT', 'QNTUSDT',
    'FLOWUSDT', 'ICPUSDT', 'THETAUSDT', 'XTZUSDT', 'MKRUSDT', 'FTMUSDT', 'AAVEUSDT', 'SNXUSDT', 'CRVUSDT', 'COMPUSDT',
    'UNIUSDT', 'SUSHIUSDT', 'YFIUSDT', 'ZRXUSDT', 'BATUSDT', 'RENUSDT', 'KNCUSDT', 'LRCUSDT', 'ALPHAUSDT', 'ZENUSDT',
    
    // Mid Caps (Top 51-150)
    'ONEUSDT', 'ONTUSDT', 'ZILUSDT', 'RVNUSDT', 'CELRUSDT', 'CTKUSDT', 'AKROUSDT', 'ANKRUSDT', 'AUDIOUSDT', 'AVAUSDT',
    'BELUSDT', 'BLZUSDT', 'BNXUSDT', 'BTCSTUSDT', 'CELOUSDT', 'CFXUSDT', 'CKBUSDT', 'COTIUSDT', 'CTSIUSDT', 'CVXUSDT',
    'DARUSDT', 'DASHUSDT', 'DATAUSDT', 'DENTUSDT', 'DGBUSDT', 'DNTUSDT', 'DUSKUSDT', 'DYDXUSDT', 'EGLDUSDT',
    'ENSUSDT', 'EOSUSDT', 'FETUSDT', 'FIDAUSDT', 'FLMUSDT', 'FORTHUSDT', 'FTTUSDT', 'GALUSDT', 'GMTUSDT', 'GRTUSDT',
    'GTCUSDT', 'HBARUSDT', 'HNTUSDT', 'HOTUSDT', 'INOSUSDT', 'IOSTUSDT', 'IOTAUSDT', 'JASMYUSDT', 'JOEUSDT', 'KAVAUSDT',
    
    // Smaller but Active Caps (150-300)
    'KEYUSDT', 'KLAYUSDT', 'KSMUSDT', 'LAZIOUSDT', 'LDOUSDT', 'LEVERUSDT', 'LINAUSDT', 'LITUSDT', 'LOOKSUSDT', 'LPTUSDT',
    'LUNAUSDT', 'MAGICUSDT', 'MASKUSDT', 'MDTUSDT', 'MINAUSDT', 'MOVRUSDT', 'MTLUSDT', 'NKNUSDT', 'NMRUSDT', 'NULSUSDT',
    'OCEANUSDT', 'OGNUSDT', 'OMGUSDT', 'ONGUSDT', 'OPUSDT', 'ORBSUSDT', 'OXTUSDT', 'PENDLEUSDT', 'PEOPLEUSDT', 'PERPUSDT',
    'PHBUSDT', 'POLYXUSDT', 'PORAUSDT', 'PUNDIXUSDT', 'QTUMUSDT', 'RAREUSDT', 'RAYUSDT', 'REEFUSDT', 'REQUSDT', 'RLCUSDT',
    'ROSEUSDT', 'RNDRUSDT', 'RUNEUSDT', 'SCRTUSDT', 'SFPUSDT', 'SKLUSDT', 'SLPUSDT', 'SPELLUSDT', 'SRMUSDT', 'STGUSDT',
    
    // DeFi & New Generation (300-400)
    'CAKEUSDT', 'INJUSDT', 'GMXUSDT', 'ARBUSDT', 'BLURUSDT', 'SUIUSDT', 'APTUSDT', 'SEIUSDT', 'STXUSDT', 'KASUSDT',
    'MANTAUSDT', 'STRKUSDT', 'PYTHUSDT', 'JUPUSDT', 'TIAUSDT', 'ALTUSDT', 'MEMEUSDT', 'ACEUSDT', 'NFPUSDT', 'AIUSDT',
    
    // Meme Coins & High Volume
    'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT', 'BOMEUSDT', 'MYRO', 'RATUSDT', 'ORDIUSDT', '1000SATSUSDT',
    
    // Additional Active Trading Pairs (400-500+)
    'AERGOUSDT', 'AGIUSDT', 'AIOUSDT', 'ALICEUSDT', 'AMBUSDT', 'AMPUSDT', 'ANCUSDT', 'ANTUSDT', 'ARDRUSDT', 'ARUSDT',
    'ATALUSDT', 'ATMUSDT', 'ATOMUSDT', 'AUCTIONUSDT', 'BADGERUSDT', 'BALUSDT', 'BANDUSDT', 'BNTUSDT', 'BONDUSDT', 'BTSUSDT',
    'BURGERUSDT', 'BZRXUSDT', 'C98USDT', 'CHESSUSDT', 'CHRUSDT', 'CLVUSDT', 'COCOSUSDT', 'COSUSDT', 'CREAMUSDT', 'CUBUSDT',
    'CVPUSDT', 'DEGOUSDT', 'DEXEUSDT', 'DFUSDT', 'DIABUSDT', 'DOCKUSDT', 'DREPUSDT', 'DUSKUSDT', 'DVIUSDT', 'DYORUSDT',
    'EASYUSDT', 'ELFUSDT', 'EPXUSDT', 'ERNUSDT', 'ETHWUSDT', 'FARMUSDT', 'FISUSDT', 'FMOUSDT', 'FORUSDT', 'FRONTUSDT',
    'FXSUSDT', 'GHSTUSDT', 'GLMRUSDT', 'GLMUSDT', 'GMTUSDT', 'GNOUSDT', 'GOUSDT', 'GPUSDT', 'HARDUSDT', 'HFTUSDT',
    'HIVEUSDT', 'ICXUSDT', 'IDUSDT', 'IDEXUSDT', 'ILVUSDT', 'IMXUSDT', 'INJUSDT', 'IRISUSDT', 'JASMYUSDT', 'JSMUSDT',
    'KDAUSDT', 'KEEPUSDT', 'KEYUSDT', 'KLAYUSDT', 'KLAYUSDT', 'LAZIOUSDT', 'LRCUSDT', 'LTOUSDT', 'LUNCUSDT', 'LYXEUSDT',
    'MBOXUSDT', 'MDXUSDT', 'MIOUSDT', 'MITHUSDT', 'MKTUSDT', 'MLNUSDT', 'MOBUSDT', 'MOODENGUSDT', 'MRBEASTUSDT', 'MXUSDT',
    'NCTUSDT', 'NEBLUSDT', 'NFTUSDT', 'NIFTYUSDT', 'NUBSUSDT', 'NXMUSDT', 'OGUSDT', 'OMUSDT', 'PAXGUSDT', 'PENDLEUSDT',
    'PENUUSDT', 'PIKAUSDT', 'PIXELUSDT', 'PNUTUSDT', 'POPCATUSDT', 'PROMUSDT', 'PROSUSDT', 'PSGUSDT', 'PUNDIXUSDT', 'PYSUSDT',
    'QUICKUSDT', 'RADUSDT', 'RAMUSDT', 'RDNTUSDT', 'REEFUSDT', 'REIUSDT', 'RIFUSDT', 'RNDRUSDT', 'RPLAUSDT', 'RSRUSDT',
    'SAFEUSDT', 'SANTOSUSDT', 'SCUSDT', 'SCRTUSDT', 'SEIUSDT', 'SELFUSDT', 'SFTUSDT', 'SHLBUSDT', 'SKLUSDT', 'SNTUSDT',
    'SNXUSDT', 'SYSUSDT', 'TFUELUSDT', 'TLMUSDT', 'TOKENUSDT', 'TORNUSDT', 'TRBUSDT', 'TRIBEUSDT', 'TRUUSDT', 'TUSDT',
    'TVKUSDT', 'TWTUSDT', 'UMAUSDT', 'UNFIUSDT', 'UTKUSDT', 'VGXUSDT', 'VIDTUSDT', 'VITEUSDT', 'VOXELUSDT', 'VTHOUSDT',
    'WAXPUSDT', 'WBETHUSDT', 'WLDUSDT', 'WOOUSDT', 'WRXUSDT', 'XCNUSDT', 'XECUSDT', 'XEMXUSDT', 'XLMUSDT', 'XNOUSDT',
    'XTZUSDT', 'XVGUSDT', 'XVSUSDT', 'YFIUSDT', 'YGUSDT', 'YOYOUSDT', 'ZECUSDT', 'ZRXUSDT', 'ZYXUSDT', 'ZILUSDT'
  ];

  // Classificação por market cap (top 50 são considerados high cap)
  const highMarketCapAssets = allBinanceAssets.slice(0, 50);

  // Sistema de limpeza automática - remove liquidações antigas a cada minuto
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      console.log('🧹 Limpando liquidações antigas...');
      
      setLongLiquidations(prev => {
        const filtered = prev.filter(liq => liq.lastUpdateTime > fifteenMinutesAgo);
        const removed = prev.length - filtered.length;
        if (removed > 0) {
          console.log(`🗑️ Removidas ${removed} liquidações LONG antigas`);
        }
        return filtered;
      });
      
      setShortLiquidations(prev => {
        const filtered = prev.filter(liq => liq.lastUpdateTime > fifteenMinutesAgo);
        const removed = prev.length - filtered.length;
        if (removed > 0) {
          console.log(`🗑️ Removidas ${removed} liquidações SHORT antigas`);
        }
        return filtered;
      });
    }, 60000); // A cada 1 minuto

    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    const newLongLiquidations: LiquidationBubble[] = [];
    const newShortLiquidations: LiquidationBubble[] = [];
    const now = new Date();

    flowData.forEach(data => {
      // Validar dados obrigatórios
      if (!data.ticker || !data.price || !data.volume || data.change_24h === undefined) {
        return;
      }

      const priceChange = Math.abs(data.change_24h || 0);
      const volumeValue = data.volume * data.price;
      const isHighMarketCap = highMarketCapAssets.includes(data.ticker);
      
      // Critérios para detectar liquidação
      const threshold = isHighMarketCap ? 
        { volume: 30000, priceChange: 1.0 } :   // Top 50: $30k + 1%
        { volume: 5000, priceChange: 1.5 };     // Resto: $5k + 1.5%
      
      if (volumeValue > threshold.volume && priceChange > threshold.priceChange) {
        // Cálculo de intensidade
        const volumeRatio = volumeValue / threshold.volume;
        const priceRatio = priceChange / threshold.priceChange;
        const combinedRatio = (volumeRatio + priceRatio) / 2;
        
        let intensity = 1;
        if (combinedRatio >= 8) intensity = 5;
        else if (combinedRatio >= 5) intensity = 4;
        else if (combinedRatio >= 3) intensity = 3;
        else if (combinedRatio >= 2) intensity = 2;
        else intensity = 1;
        
        const liquidation: LiquidationBubble = {
          id: `${data.ticker}-${data.timestamp}`,
          asset: data.ticker.replace('USDT', ''),
          type: (data.change_24h || 0) < 0 ? 'long' : 'short',
          amount: volumeValue,
          price: data.price,
          marketCap: isHighMarketCap ? 'high' : 'low',
          timestamp: new Date(data.timestamp),
          intensity,
          change24h: data.change_24h || 0,
          volume: data.volume,
          lastUpdateTime: now,
          totalLiquidated: volumeValue // Inicializar com o valor atual
        };
        
        if (liquidation.type === 'long') {
          newLongLiquidations.push(liquidation);
        } else {
          newShortLiquidations.push(liquidation);
        }
      }
    });

    // Atualizar liquidações existentes e adicionar novas, acumulando valores
    setLongLiquidations(prev => {
      const updated = [...prev];
      
      newLongLiquidations.forEach(newLiq => {
        const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
        if (existingIndex >= 0) {
          // Atualizar liquidação existente, acumulando o valor total
          updated[existingIndex] = { 
            ...newLiq, 
            totalLiquidated: updated[existingIndex].totalLiquidated + newLiq.amount,
            lastUpdateTime: now
          };
        } else {
          updated.push(newLiq);
        }
      });
      
      // ORDENAR POR MAIOR VALOR TOTAL LIQUIDADO
      return updated
        .sort((a, b) => b.totalLiquidated - a.totalLiquidated)
        .slice(0, 100);
    });
    
    setShortLiquidations(prev => {
      const updated = [...prev];
      
      newShortLiquidations.forEach(newLiq => {
        const existingIndex = updated.findIndex(liq => liq.asset === newLiq.asset);
        if (existingIndex >= 0) {
          // Atualizar liquidação existente, acumulando o valor total
          updated[existingIndex] = { 
            ...newLiq, 
            totalLiquidated: updated[existingIndex].totalLiquidated + newLiq.amount,
            lastUpdateTime: now
          };
        } else {
          updated.push(newLiq);
        }
      });
      
      // ORDENAR POR MAIOR VALOR TOTAL LIQUIDADO
      return updated
        .sort((a, b) => b.totalLiquidated - a.totalLiquidated)
        .slice(0, 100);
    });
  }, [flowData]);

  const formatAmount = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0.00';
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatChange = (change: number) => {
    if (change === undefined || change === null || isNaN(change)) return '0.00%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getIntensityColor = (intensity: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-700',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-red-200 text-red-900'
    };
    return colors[intensity as keyof typeof colors] || colors[1];
  };

  const LiquidationTable = ({ 
    title, 
    liquidations, 
    icon: Icon, 
    bgColor,
    textColor
  }: { 
    title: string; 
    liquidations: LiquidationBubble[]; 
    icon: any; 
    bgColor: string;
    textColor: string;
  }) => (
    <div className="flex-1 min-h-0">
      <div className={`p-3 ${bgColor} rounded-t-lg border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <span className="text-sm text-white/80">({liquidations.length})</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white" style={{ height: '400px', overflowY: 'auto' }}>
        {liquidations.length > 0 ? (
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-20">Asset</TableHead>
                <TableHead className="w-24">Price</TableHead>
                <TableHead className="w-20">24h %</TableHead>
                <TableHead className="w-28">Total Liq</TableHead>
                <TableHead className="w-20">Cap</TableHead>
                <TableHead className="w-16">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liquidations.map((liquidation) => (
                <TableRow key={liquidation.id} className="hover:bg-gray-50">
                  <TableCell className="font-bold">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${liquidation.type === 'long' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className={textColor}>{liquidation.asset}</span>
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
                    {formatAmount(liquidation.totalLiquidated)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      liquidation.marketCap === 'high' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {liquidation.marketCap === 'high' ? 'HIGH' : 'LOW'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(liquidation.intensity)}`}>
                      {liquidation.intensity}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-2">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto" />
              <h4 className="text-lg font-medium text-gray-600">No {title}</h4>
              <p className="text-gray-500 text-sm">Aguardando liquidações...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Live Liquidations Monitor - BY TOTAL LIQUIDATED</h2>
              <p className="text-sm text-gray-500">
                Ordenado por maior valor total liquidado • Auto-remove após 15min sem atividade • {allBinanceAssets.length}+ assets
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Long Liquidations</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Short Liquidations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidation Tables */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <LiquidationTable
          title="Long Liquidations"
          liquidations={longLiquidations}
          icon={TrendingDown}
          bgColor="bg-red-600"
          textColor="text-red-700"
        />
        
        <LiquidationTable
          title="Short Liquidations"
          liquidations={shortLiquidations}
          icon={TrendingUp}
          bgColor="bg-green-600"
          textColor="text-green-700"
        />
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-center space-x-8 text-sm">
          <div className="text-center">
            <div className="font-bold text-red-600">{longLiquidations.length}</div>
            <div className="text-gray-600">Long Liq</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">{shortLiquidations.length}</div>
            <div className="text-gray-600">Short Liq</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-800">
              {formatAmount(
                [...longLiquidations, ...shortLiquidations]
                  .reduce((total, liq) => total + liq.totalLiquidated, 0)
              )}
            </div>
            <div className="text-gray-600">Total Liquidated</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-600">{allBinanceAssets.length}+</div>
            <div className="text-gray-600">Assets Tracked</div>
          </div>
        </div>
      </div>
    </div>
  );
};
