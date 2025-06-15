
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, TrendingUp, DollarSign, Users, Zap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface OnChainMetric {
  id: string;
  metric: string;
  value: string;
  change24h: number;
  description: string;
  category: 'defi' | 'nft' | 'whale' | 'exchange';
  timestamp: string;
}

interface LargeTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  usdValue: number;
  timestamp: string;
  type: 'whale_movement' | 'exchange_inflow' | 'exchange_outflow' | 'defi_interaction';
}

const ArkhamIntelligence: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<OnChainMetric[]>([]);
  const [transactions, setTransactions] = useState<LargeTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simular dados da Arkham Intelligence (substituir por API real)
  const generateMetrics = (): OnChainMetric[] => {
    const baseMetrics = [
      { metric: 'Total Value Locked (TVL)', value: '$45.2B', change: 2.3, desc: 'Total assets locked in DeFi protocols', cat: 'defi' },
      { metric: 'Whale Transactions (24h)', value: '1,247', change: -5.1, desc: 'Transactions > $1M USD', cat: 'whale' },
      { metric: 'Exchange Inflows', value: '$892M', change: 15.7, desc: '24h exchange inflows', cat: 'exchange' },
      { metric: 'Exchange Outflows', value: '$567M', change: -8.3, desc: '24h exchange outflows', cat: 'exchange' },
      { metric: 'Active Addresses', value: '845K', change: 3.2, desc: 'Unique active addresses 24h', cat: 'defi' },
      { metric: 'NFT Trading Volume', value: '$23.4M', change: -12.1, desc: 'Total NFT sales volume', cat: 'nft' },
    ];

    return baseMetrics.map((metric, index) => ({
      id: `metric-${index}`,
      metric: metric.metric,
      value: metric.value,
      change24h: metric.change,
      description: metric.desc,
      category: metric.cat as any,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }));
  };

  const generateTransactions = (): LargeTransaction[] => {
    const wallets = [
      'whale_wallet_1', 'binance_hot', 'coinbase_custody', 'unknown_whale',
      'defi_protocol', 'arbitrage_bot', 'institutional_wallet'
    ];
    
    const tokens = ['ETH', 'BTC', 'USDC', 'USDT', 'WETH', 'LINK', 'UNI'];
    const types: LargeTransaction['type'][] = ['whale_movement', 'exchange_inflow', 'exchange_outflow', 'defi_interaction'];

    return Array.from({ length: 15 }, (_, i) => ({
      id: `tx-${i}`,
      hash: `0x${Math.random().toString(16).substring(2, 18)}...`,
      from: wallets[Math.floor(Math.random() * wallets.length)],
      to: wallets[Math.floor(Math.random() * wallets.length)],
      amount: (Math.random() * 10000).toFixed(2),
      token: tokens[Math.floor(Math.random() * tokens.length)],
      usdValue: Math.random() * 50000000,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      type: types[Math.floor(Math.random() * types.length)]
    })).sort((a, b) => b.usdValue - a.usdValue);
  };

  const fetchArkhamData = async () => {
    setLoading(true);
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setMetrics(generateMetrics());
    setTransactions(generateTransactions());
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchArkhamData();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(fetchArkhamData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'defi': return <DollarSign className="w-4 h-4" />;
      case 'whale': return <TrendingUp className="w-4 h-4" />;
      case 'exchange': return <Activity className="w-4 h-4" />;
      case 'nft': return <Users className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'defi': return 'text-[#A6FF00]';
      case 'whale': return 'text-[#00E0FF]';
      case 'exchange': return 'text-[#FF4D4D]';
      case 'nft': return 'text-[#FF8C00]';
      default: return 'text-[#AAAAAA]';
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'whale_movement': return '🐋';
      case 'exchange_inflow': return '📥';
      case 'exchange_outflow': return '📤';
      case 'defi_interaction': return '🔄';
      default: return '💸';
    }
  };

  const formatUSD = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - eventTime.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h atrás`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1E] to-[#0A0A0A]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="p-4 border-b border-[#2E2E2E] bg-[#1C1C1E]/90 backdrop-blur-md rounded-t-2xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>VOLTAR</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#FF4D4D] to-[#FF8C00] rounded-lg flex items-center justify-center relative">
                  <Activity className="w-5 h-5 text-white" />
                  <div className="absolute inset-0 bg-[#FF4D4D]/20 rounded-lg animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F5F5F5] font-mono">ARKHAM INTELLIGENCE 🔍</h2>
                  <div className="flex items-center space-x-4 text-sm text-[#AAAAAA]">
                    <span>On-Chain Analytics & Whale Tracking</span>
                    <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={fetchArkhamData}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH</span>
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {metrics.map((metric) => (
            <Card key={metric.id} className="bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm text-[#AAAAAA]">
                  <div className="flex items-center space-x-2">
                    <div className={getCategoryColor(metric.category)}>
                      {getCategoryIcon(metric.category)}
                    </div>
                    <span>{metric.metric}</span>
                  </div>
                  <Badge variant={metric.change24h >= 0 ? "default" : "destructive"} className="text-xs">
                    {metric.change24h >= 0 ? '+' : ''}{metric.change24h.toFixed(1)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#F5F5F5] font-mono mb-2">{metric.value}</div>
                <p className="text-xs text-[#AAAAAA]">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Large Transactions */}
        <Card className="bg-[#1C1C1E] border-[#2E2E2E]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
              <TrendingUp className="w-5 h-5 text-[#00E0FF]" />
              <span>LARGE TRANSACTIONS (últimas 24h)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-[#AAAAAA] uppercase bg-[#0A0A0A] border-b border-[#2E2E2E]">
                  <tr>
                    <th className="py-3 px-4 text-left">Tipo</th>
                    <th className="py-3 px-4 text-left">Hash</th>
                    <th className="py-3 px-4 text-left">From → To</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">USD Value</th>
                    <th className="py-3 px-4 text-center">Tempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E2E]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#2E2E2E]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTransactionTypeIcon(tx.type)}</span>
                          <span className="text-xs text-[#AAAAAA] capitalize">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[#00E0FF] text-xs">{tx.hash}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <div className="text-[#A6FF00]">{tx.from}</div>
                          <div className="text-[#AAAAAA]">↓</div>
                          <div className="text-[#FF4D4D]">{tx.to}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-[#F5F5F5]">
                          {tx.amount} {tx.token}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-[#A6FF00] font-bold">
                          {formatUSD(tx.usdValue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs text-[#AAAAAA]">
                          {getTimeAgo(tx.timestamp)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArkhamIntelligence;
