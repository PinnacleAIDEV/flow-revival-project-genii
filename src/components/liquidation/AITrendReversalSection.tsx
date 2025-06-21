
import React from 'react';
import { Brain, Zap, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { useAITrendReversal } from '../../hooks/useAITrendReversal';

// Interface para trend reversal (dados combinados)
interface TrendReversalAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'low';
  longPositions: number;
  longLiquidated: number;
  shortPositions: number;
  shortLiquidated: number;
  totalPositions: number;
  combinedTotal: number;
  dominantType: 'long' | 'short';
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  volatility: number;
  intensity: number;
  liquidationHistory: Array<{
    type: 'long' | 'short';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}

interface AITrendReversalSectionProps {
  unifiedAssets: Map<string, TrendReversalAsset>;
  onAssetClick: (asset: string) => void;
}

export const AITrendReversalSection: React.FC<AITrendReversalSectionProps> = ({
  unifiedAssets,
  onAssetClick
}) => {
  const { 
    aiAnalysis, 
    isAnalyzing, 
    analysisError,
    getLiquidationFlips,
    getAggregatedMetrics,
    hasData 
  } = useAITrendReversal(unifiedAssets);

  const liquidationFlips = getLiquidationFlips();
  const metrics = getAggregatedMetrics();

  const formatAmount = (amount: number) => {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'LONG_LIQUIDATIONS') return <TrendingDown className="w-3 h-3 text-red-500" />;
    if (direction === 'SHORT_LIQUIDATIONS') return <TrendingUp className="w-3 h-3 text-green-500" />;
    return <Zap className="w-3 h-3 text-blue-500" />;
  };

  return (
    <Card className="h-full bg-gradient-to-br from-purple-950/90 to-indigo-950/90 border-purple-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-3 text-purple-300">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="font-mono">AI TREND REVERSAL 🔄</span>
            <div className="flex items-center space-x-2 text-sm font-normal mt-1">
              {isAnalyzing && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-purple-400">Analisando padrões...</span>
                </div>
              )}
              {hasData && (
                <Badge className="bg-purple-600/30 text-purple-300 border-purple-500">
                  {liquidationFlips.length} reversões detectadas
                </Badge>
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[calc(100%-120px)]">
        {analysisError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-red-300 text-sm">Erro na análise de IA</p>
              <p className="text-red-400 text-xs">{analysisError}</p>
            </div>
          </div>
        ) : !hasData && !isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Brain className="w-12 h-12 text-purple-400 mx-auto opacity-50" />
              <div>
                <h4 className="text-lg font-medium text-purple-300 mb-2">Aguardando Liquidações</h4>
                <p className="text-purple-400 text-sm max-w-xs">
                  A IA está monitorando o mercado em busca de padrões de reversão de tendência...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {/* Métricas Agregadas */}
              {metrics && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-purple-900/30 rounded-lg p-2">
                    <div className="text-xs text-purple-400">Confiança Média</div>
                    <div className="text-lg font-bold text-purple-300">
                      {metrics.avgConfidence.toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2">
                    <div className="text-xs text-purple-400">Padrões Críticos</div>
                    <div className="text-lg font-bold text-red-400">
                      {metrics.highSeverityCount}
                    </div>
                  </div>
                </div>
              )}

              {/* Padrões Detectados */}
              {aiAnalysis?.detectedPatterns.map((pattern, index) => (
                <div
                  key={`${pattern.asset}-${index}`}
                  className="p-3 rounded-lg cursor-pointer transition-all hover:bg-purple-900/20 border border-purple-800/30"
                  onClick={() => onAssetClick(pattern.asset)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-purple-200">{pattern.asset}</span>
                      {getDirectionIcon(pattern.nextProbableDirection)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(pattern.severity)}`}>
                        {pattern.severity}
                      </span>
                      <span className="text-xs text-purple-400">
                        {pattern.confidence}%
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-purple-300 mb-2">
                    <strong>{pattern.pattern}</strong>
                  </div>

                  <div className="text-xs text-purple-400 mb-2">
                    {pattern.description}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-purple-500">Velocidade:</span>
                      <span className="text-purple-300 ml-1">
                        {pattern.metrics.liquidationVelocity.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-500">L/S Ratio:</span>
                      <span className="text-purple-300 ml-1">
                        {pattern.metrics.lsRatio.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-500">Cascata:</span>
                      <span className="text-purple-300 ml-1">
                        {(pattern.metrics.cascadeProbability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-purple-400 italic">
                    "{pattern.reasoning}"
                  </div>
                </div>
              ))}

              {/* Resumo do Mercado */}
              {aiAnalysis?.marketSummary && (
                <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-700/50">
                  <div className="text-xs font-bold text-purple-300 mb-1">
                    RESUMO DO MERCADO
                  </div>
                  <div className="text-xs text-purple-400 mb-2">
                    Padrão Dominante: <strong className="text-purple-300">{aiAnalysis.marketSummary.dominantPattern}</strong>
                  </div>
                  <div className="text-xs text-purple-400 mb-2">
                    Risco Geral: <span className={`font-bold ${
                      aiAnalysis.marketSummary.overallRisk === 'CRITICAL' ? 'text-red-400' :
                      aiAnalysis.marketSummary.overallRisk === 'HIGH' ? 'text-orange-400' :
                      aiAnalysis.marketSummary.overallRisk === 'MEDIUM' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {aiAnalysis.marketSummary.overallRisk}
                    </span>
                  </div>
                  <div className="text-xs text-purple-300 italic">
                    {aiAnalysis.marketSummary.recommendation}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
