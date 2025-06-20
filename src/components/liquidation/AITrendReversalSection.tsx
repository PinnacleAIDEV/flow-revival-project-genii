
import React from 'react';
import { Brain, Zap, TrendingUp, TrendingDown, AlertTriangle, Activity, Target, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { useAITrendReversal } from '../../hooks/useAITrendReversal';
import { UnifiedLiquidationAsset } from '../../types/liquidation';

interface AITrendReversalSectionProps {
  unifiedAssets: Map<string, UnifiedLiquidationAsset>;
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
    analyzePatterns,
    getPatternsBySeverity,
    getLiquidationFlips,
    getAggregatedMetrics,
    hasData,
    lastAnalyzed
  } = useAITrendReversal(unifiedAssets);

  const getPatternIcon = (pattern: string) => {
    if (pattern.toLowerCase().includes('flip') || pattern.toLowerCase().includes('reversal') || pattern.toLowerCase().includes('iceberg')) {
      return <Zap className="w-4 h-4" />;
    }
    if (pattern.toLowerCase().includes('cascade')) {
      return <TrendingDown className="w-4 h-4" />;
    }
    if (pattern.toLowerCase().includes('squeeze')) {
      return <Activity className="w-4 h-4" />;
    }
    return <Target className="w-4 h-4" />;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800 border-blue-200',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
      'CRITICAL': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity as keyof typeof colors] || colors.LOW;
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'LONG_LIQUIDATIONS') return <TrendingDown className="w-4 h-4 text-red-500" />;
    if (direction === 'SHORT_LIQUIDATIONS') return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const formatTimeframe = (timeframe: string) => {
    return timeframe || '5min';
  };

  const metrics = getAggregatedMetrics();
  const liquidationFlips = getLiquidationFlips();
  const highSeverityPatterns = getPatternsBySeverity('HIGH').concat(getPatternsBySeverity('CRITICAL'));

  return (
    <div className="h-full">
      <Card className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-purple-500 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2 text-purple-200 font-mono">
                  <span>AI TREND REVERSAL DETECTOR</span>
                  {isAnalyzing && <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />}
                </CardTitle>
                <p className="text-sm text-purple-300 font-mono">
                  Detecta Liquidation Flips e 7 outros padrões avançados
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={analyzePatterns}
                disabled={isAnalyzing}
                className="border-purple-400 text-purple-200 hover:bg-purple-800/50"
              >
                {isAnalyzing ? 'Analisando...' : 'Analisar Agora'}
              </Button>
            </div>
          </div>

          {/* Status da IA */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center space-x-2">
              {analysisError ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300">Erro: {analysisError}</span>
                </>
              ) : hasData ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-300">
                    IA Online - {aiAnalysis?.detectedPatterns.length} padrões detectados, última análise: {lastAnalyzed.toLocaleTimeString()}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-yellow-300">Aguardando liquidações para análise...</span>
                </>
              )}
            </div>
            
            {aiAnalysis?.marketSummary && (
              <Badge className={`${getSeverityColor(aiAnalysis.marketSummary.overallRisk)} text-xs`}>
                Risco: {aiAnalysis.marketSummary.overallRisk}
              </Badge>
            )}
          </div>

          {/* Métricas Agregadas */}
          {metrics && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="bg-purple-800/30 rounded-lg p-3 text-center">
                <div className="text-purple-200 text-xs font-medium">Confiança Média</div>
                <div className="text-purple-100 text-lg font-bold">{metrics.avgConfidence.toFixed(0)}%</div>
              </div>
              <div className="bg-indigo-800/30 rounded-lg p-3 text-center">
                <div className="text-indigo-200 text-xs font-medium">Padrões Detectados</div>
                <div className="text-indigo-100 text-lg font-bold">{metrics.totalPatterns}</div>
              </div>
              <div className="bg-pink-800/30 rounded-lg p-3 text-center">
                <div className="text-pink-200 text-xs font-medium">Alta Severidade</div>
                <div className="text-pink-100 text-lg font-bold">{metrics.highSeverityCount}</div>
              </div>
              <div className="bg-cyan-800/30 rounded-lg p-3 text-center">
                <div className="text-cyan-200 text-xs font-medium">Liquidation Flips</div>
                <div className="text-cyan-100 text-lg font-bold">{liquidationFlips.length}</div>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-250px)]">
          {aiAnalysis?.detectedPatterns.length ? (
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                {/* Liquidation Flips em destaque */}
                {liquidationFlips.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-yellow-300 font-bold">🧊 LIQUIDATION FLIPS DETECTADOS (ICEBERG)</h3>
                      <Badge className="bg-yellow-400/20 text-yellow-300">{liquidationFlips.length}</Badge>
                    </div>
                    
                    {liquidationFlips.map((pattern, index) => (
                      <div
                        key={`flip-${index}`}
                        className="p-4 rounded-lg border-l-4 border-yellow-400 bg-gradient-to-r from-yellow-900/40 to-orange-900/30 hover:from-yellow-900/50 hover:to-orange-900/40 transition-all cursor-pointer"
                        onClick={() => onAssetClick(pattern.asset)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <span className="font-bold text-yellow-100 text-lg">{pattern.asset}</span>
                            <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400">
                              {pattern.confidence}% confiança
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getDirectionIcon(pattern.nextProbableDirection)}
                            <Badge className={getSeverityColor(pattern.severity)}>
                              {pattern.severity}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-yellow-200 text-sm leading-relaxed">{pattern.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                          <div>
                            <span className="text-yellow-300">Velocidade:</span>
                            <div className="text-yellow-100 font-mono">{pattern.metrics.liquidationVelocity.toFixed(2)}/min</div>
                          </div>
                          <div>
                            <span className="text-yellow-300">L/S Ratio:</span>
                            <div className="text-yellow-100 font-mono">{pattern.metrics.lsRatio.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-yellow-300">Cascade Risk:</span>
                            <div className="text-yellow-100 font-mono">{(pattern.metrics.cascadeProbability * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-yellow-400/30">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-yellow-400">🧠 {pattern.reasoning}</span>
                            <div className="flex items-center space-x-1 text-yellow-300">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeframe(pattern.timeframe)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Outros padrões */}
                {aiAnalysis.detectedPatterns.filter(p => !liquidationFlips.includes(p)).map((pattern, index) => (
                  <div
                    key={`pattern-${index}`}
                    className="p-4 rounded-lg border-l-4 border-purple-500 bg-gradient-to-r from-purple-900/30 to-indigo-900/20 hover:from-purple-900/40 hover:to-indigo-900/30 transition-all cursor-pointer"
                    onClick={() => onAssetClick(pattern.asset)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getPatternIcon(pattern.pattern)}
                        <span className="font-bold text-purple-100 text-lg">{pattern.asset}</span>
                        <Badge variant="outline" className="text-purple-300 border-purple-400">
                          {pattern.pattern}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-500/20 text-purple-300">
                          {pattern.confidence}%
                        </Badge>
                        <Badge className={getSeverityColor(pattern.severity)}>
                          {pattern.severity}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-purple-200 text-sm leading-relaxed">{pattern.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-purple-300">Velocidade:</span>
                        <div className="text-purple-100 font-mono">{pattern.metrics.liquidationVelocity.toFixed(2)}/min</div>
                      </div>
                      <div>
                        <span className="text-purple-300">L/S Ratio:</span>
                        <div className="text-purple-100 font-mono">{pattern.metrics.lsRatio.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-purple-300">Próxima Dir.:</span>
                        <div className="text-purple-100 flex items-center space-x-1">
                          {getDirectionIcon(pattern.nextProbableDirection)}
                          <span className="text-xs">{pattern.nextProbableDirection.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-500/30">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-purple-400">🧠 {pattern.reasoning}</span>
                        <div className="flex items-center space-x-1 text-purple-300">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeframe(pattern.timeframe)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Resumo do Mercado */}
                {aiAnalysis.marketSummary && (
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-indigo-200 font-bold">RESUMO DO MERCADO IA</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-indigo-300">Padrão Dominante:</span>
                        <span className="text-indigo-100 font-mono">{aiAnalysis.marketSummary.dominantPattern}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-300">Risco Geral:</span>
                        <Badge className={getSeverityColor(aiAnalysis.marketSummary.overallRisk)}>
                          {aiAnalysis.marketSummary.overallRisk}
                        </Badge>
                      </div>
                      <div className="pt-2 border-t border-indigo-500/30">
                        <p className="text-indigo-100 text-sm">
                          💡 <strong>Recomendação IA:</strong> {aiAnalysis.marketSummary.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-full flex items-center justify-center mx-auto">
                  {analysisError ? (
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  ) : (
                    <Brain className="w-8 h-8 text-purple-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-purple-200 mb-2">
                    {analysisError ? 'Erro na Análise de IA' : 
                     isAnalyzing ? 'IA Analisando Padrões...' : 
                     'IA Pronta para Análise'}
                  </h4>
                  <p className="text-purple-300 text-sm max-w-xs mx-auto">
                    {analysisError ? `Erro: ${analysisError}` :
                     isAnalyzing ? 'Detectando liquidation flips, cascades e outros padrões avançados...' :
                     'Aguardando dados de liquidação para análise com inteligência artificial'}
                  </p>
                  
                  {analysisError && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={analyzePatterns}
                      className="mt-4 border-purple-400 text-purple-200 hover:bg-purple-800/50"
                    >
                      Tentar Novamente
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
