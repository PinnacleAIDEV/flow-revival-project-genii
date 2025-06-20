
import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relevance: number; // 1-10
  assets: string[];
  timestamp: Date;
  source: string;
  url?: string;
}

export const NewsAnalyzer: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock news data - em produção conectaria com APIs de notícias reais
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'Bitcoin ETF Inflows Surge as Institutional Adoption Grows',
      summary: 'Large institutional investors continue to pour money into Bitcoin ETFs, signaling strong confidence in crypto assets.',
      sentiment: 'bullish',
      relevance: 9,
      assets: ['BTC', 'ETH'],
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      source: 'CoinDesk',
      url: 'https://coindesk.com'
    },
    {
      id: '2',
      title: 'Regulatory Uncertainty Causes Market Volatility',
      summary: 'Recent regulatory announcements have created uncertainty in the crypto market, leading to increased volatility.',
      sentiment: 'bearish',
      relevance: 7,
      assets: ['BTC', 'ETH', 'XRP'],
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      source: 'Reuters',
      url: 'https://reuters.com'
    },
    {
      id: '3',
      title: 'DeFi Protocol Launches New Yield Farming Options',
      summary: 'A major DeFi protocol has announced new yield farming opportunities with competitive rates.',
      sentiment: 'bullish',
      relevance: 6,
      assets: ['AAVE', 'UNI', 'COMP'],
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      source: 'The Block',
      url: 'https://theblock.co'
    }
  ];

  useEffect(() => {
    // Simular carregamento de notícias
    setLoading(true);
    setTimeout(() => {
      setNews(mockNews);
      setLoading(false);
    }, 1000);
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'bearish': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 8) return 'text-red-400';
    if (relevance >= 6) return 'text-orange-400';
    if (relevance >= 4) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <Card className="h-full bg-[#1C1C1E] border-[#2E2E2E]">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
          <Newspaper className="w-5 h-5 text-[#00E0FF]" />
          <span>NEWS ANALYZER</span>
          <Badge className="bg-[#00E0FF]/20 text-[#00E0FF]">
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-[#AAAAAA]">
            <div className="animate-spin w-6 h-6 border-2 border-[#00E0FF] border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Analisando notícias...</p>
          </div>
        ) : news.length > 0 ? news.map((item) => (
          <div key={item.id} className="p-4 bg-[#0A0A0A] rounded border border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-[#F5F5F5] text-sm leading-tight mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-[#AAAAAA] leading-relaxed mb-3">
                  {item.summary}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="ml-2 p-1">
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Badge className={getSentimentColor(item.sentiment)}>
                  {item.sentiment.toUpperCase()}
                </Badge>
                <span className={`font-mono ${getRelevanceColor(item.relevance)}`}>
                  REL: {item.relevance}/10
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {item.assets.slice(0, 3).map(asset => (
                    <Badge key={asset} variant="outline" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
                <span className="text-[#888888]">{item.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-[#AAAAAA]">
            <Newspaper className="w-8 h-8 mx-auto mb-2 text-[#00E0FF]/50" />
            <p>Nenhuma notícia disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
