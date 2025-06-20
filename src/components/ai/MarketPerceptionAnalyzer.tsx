
import React, { useState, useEffect } from 'react';
import { Brain, MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useRealFlowData } from '../../hooks/useRealFlowData';

interface AnalysisResult {
  id: string;
  prompt: string;
  analysis: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  keyPoints: string[];
  timestamp: Date;
  associatedAssets: string[];
}

export const MarketPerceptionAnalyzer: React.FC = () => {
  const { flowData, alerts } = useRealFlowData();
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const analyzeMarketPerception = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    
    // Simular análise AI - em produção conectaria com OpenAI/Claude
    setTimeout(() => {
      const mockAnalysis: AnalysisResult = {
        id: Date.now().toString(),
        prompt: prompt,
        analysis: `Baseado nos dados atuais de liquidações e volume anormal, observo uma confluência interessante de fatores. 
        
As liquidações recentes mostram um padrão de ${Math.random() > 0.5 ? 'short squeezes' : 'long liquidations'} concentradas em ativos de alta capitalização, enquanto o volume anormal indica ${Math.random() > 0.5 ? 'acumulação institucional' : 'distribuição gradual'}.

A correlação entre esses eventos sugere que o mercado está passando por uma fase de ${Math.random() > 0.5 ? 'consolidação antes de movimento bullish' : 'redistribuição com viés bearish'}.

Recomendo monitorar especialmente os níveis de suporte/resistência chave nos próximos ${Math.floor(Math.random() * 24) + 1} horas.`,
        sentiment: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
        confidence: Math.floor(Math.random() * 30) + 70,
        keyPoints: [
          'Correlação forte entre liquidações e volume anormal',
          'Padrão de acumulação/distribuição detectado',
          'Níveis críticos de suporte/resistência identificados',
          'Timeframe de 4-24h para próximos movimentos significativos'
        ],
        timestamp: new Date(),
        associatedAssets: flowData.slice(0, 5).map(d => d.ticker.replace('USDT', ''))
      };
      
      setAnalysis(mockAnalysis);
      setHistory(prev => [mockAnalysis, ...prev.slice(0, 4)]);
      setLoading(false);
      setPrompt('');
    }, 2000);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-400/20';
      case 'bearish': return 'text-red-400 bg-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/20';
    }
  };

  return (
    <Card className="h-full bg-[#1C1C1E] border-[#2E2E2E]">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
          <Brain className="w-5 h-5 text-[#00E0FF]" />
          <span>MARKET PERCEPTION AI</span>
          <Badge className="bg-[#A6FF00]/20 text-[#A6FF00]">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Faça uma pergunta sobre liquidações e volume anormal atual... Ex: 'Qual a correlação entre as liquidações de BTC e o volume anormal em altcoins?'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-[#0A0A0A] border-[#2E2E2E] text-[#F5F5F5] min-h-[80px] resize-none"
          />
          <Button 
            onClick={analyzeMarketPerception}
            disabled={loading || !prompt.trim()}
            className="w-full bg-[#00E0FF] hover:bg-[#00E0FF]/80 text-black"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                Analisando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Analisar Percepção
              </>
            )}
          </Button>
        </div>

        {/* Current Analysis */}
        {analysis && (
          <div className="p-4 bg-[#0A0A0A] rounded border border-[#2E2E2E]">
            <div className="flex items-center justify-between mb-3">
              <Badge className={getSentimentColor(analysis.sentiment)}>
                {analysis.sentiment.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Confiança: {analysis.confidence}%
              </Badge>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-[#F5F5F5] leading-relaxed whitespace-pre-line">
                {analysis.analysis}
              </p>
              
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-[#00E0FF]">PONTOS-CHAVE:</h5>
                <ul className="space-y-1">
                  {analysis.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-xs text-[#AAAAAA] flex items-start">
                      <span className="text-[#00E0FF] mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center justify-between text-xs text-[#888888] pt-2 border-t border-[#2E2E2E]">
                <div className="flex space-x-1">
                  {analysis.associatedAssets.map(asset => (
                    <Badge key={asset} variant="outline" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
                <span>{analysis.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Analysis History */}
        {history.length > 0 && (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            <h5 className="text-xs font-semibold text-[#AAAAAA] border-b border-[#2E2E2E] pb-1">
              HISTÓRICO DE ANÁLISES
            </h5>
            {history.map((item) => (
              <div key={item.id} className="p-2 bg-[#0A0A0A]/50 rounded border border-[#2E2E2E]/50">
                <div className="flex items-center justify-between mb-1">
                  <Badge className={`${getSentimentColor(item.sentiment)} text-xs`}>
                    {item.sentiment}
                  </Badge>
                  <span className="text-xs text-[#888888]">
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-[#AAAAAA] truncate">
                  {item.prompt}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
