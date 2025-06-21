
import React from 'react';
import { RefreshCw, Brain, Zap, Target, AlertTriangle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';

interface HybridAnalysis {
  detectedPatterns: Array<{
    asset: string;
    pattern: "flip" | "cascade" | "squeeze" | "hunt" | "vacuum";
    confidence: number;
    description: string;
    metrics: {
      liquidationVelocity: number;
      lsRatio: number;
      cascadeProbability: number;
      volumeSpike: number;
    };
    severity: "HIGH" | "MEDIUM" | "LOW";
    nextProbableDirection: "SHORT_LIQUIDATIONS" | "LONG_LIQUIDATIONS";
    reasoning: string;
  }>;
  marketSummary: {
    dominantPattern: string;
    overallRisk: string;
    recommendation: string;
    confidence: number;
  };
}

interface PerformanceStats {
  totalAnalyses: number;
  tokensSaved: number;
  averageResponseTime: number;
  cacheHitRate: number;
}

interface HybridTrendReversalSectionProps {
  hybridAnalysis: HybridAnalysis | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  performanceStats: PerformanceStats;
  unifiedAssets: Map<string, any>;
  onAssetClick: (asset: string) => void;
  getIcebergAlerts: () => any[];
  getCascadeAlerts: () => any[];
  getSqueezeAlerts: () => any[];
  getCriticalAlerts: () => any[];
  hasData: boolean;
  nextAnalysisIn?: number;
  triggerManualAnalysis?: () => void;
}

export const HybridTrendReversalSection: React.FC<HybridTrendReversalSectionProps> = ({
  hybridAnalysis,
  isAnalyzing,
  analysisError,
  performanceStats,
  unifiedAssets,
  onAssetClick,
  getIcebergAlerts,
  getCascadeAlerts,
  getSqueezeAlerts,
  getCriticalAlerts,
  hasData,
  nextAnalysisIn = 0,
  triggerManualAnalysis
}) => {
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'iceberg' | 'cascade' | 'squeeze' | 'critical'>('all');

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getFilteredAlerts = () => {
    switch (activeFilter) {
      case 'iceberg': return getIcebergAlerts();
      case 'cascade': return getCascadeAlerts();
      case 'squeeze': return getSqueezeAlerts();
      case 'critical': return getCriticalAlerts();
      default: return hybridAnalysis?.detectedPatterns || [];
    }
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'flip': return <TrendingUp className="w-4 h-4" />;
      case 'cascade': return <TrendingDown className="w-4 h-4" />;
      case 'squeeze': return <Zap className="w-4 h-4" />;
      case 'hunt': return <Target className="w-4 h-4" />;
      case 'vacuum': return <AlertTriangle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredAlerts = getFilteredAlerts();

  return (
    <div className="h-full">
      <Card className="bg-gray-900/90 backdrop-blur-sm border-purple-500 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2 text-purple-400 font-mono">
                  <span>HYBRID AI TREND DETECTOR</span>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    {performanceStats.tokensSaved}% tokens saved
                  </Badge>
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-400 font-mono">
                  <span>Assets: {unifiedAssets.size}</span>
                  <span>Cache: {performanceStats.cacheHitRate}%</span>
                  {nextAnalysisIn > 0 && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Próxima análise: {formatTime(nextAnalysisIn)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {triggerManualAnalysis && (
                <Button
                  onClick={triggerManualAnalysis}
                  disabled={isAnalyzing}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Analisar
                </Button>
              )}
              <div className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-120px)]">
          {/* Status da Análise */}
          {isAnalyzing && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center space-x-2 text-yellow-800">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="font-medium">Analisando padrões de liquidação...</span>
              </div>
            </div>
          )}

          {analysisError && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Erro na análise: {analysisError}</span>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Todos', count: hybridAnalysis?.detectedPatterns?.length || 0 },
                { key: 'iceberg', label: 'Iceberg', count: getIcebergAlerts().length },
                { key: 'cascade', label: 'Cascade', count: getCascadeAlerts().length },
                { key: 'squeeze', label: 'Squeeze', count: getSqueezeAlerts().length },
                { key: 'critical', label: 'Critical', count: getCriticalAlerts().length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    activeFilter === filter.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Alertas */}
          <ScrollArea className="h-full">
            {filteredAlerts.length > 0 ? (
              <div className="space-y-3 p-4">
                {filteredAlerts.map((pattern, index) => (
                  <div
                    key={`${pattern.asset}-${index}`}
                    className="p-4 rounded-lg border border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 transition-all cursor-pointer"
                    onClick={() => onAssetClick(pattern.asset)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getPatternIcon(pattern.pattern)}
                        <span className="font-bold text-white text-lg">{pattern.asset}</span>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">
                          {pattern.pattern.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(pattern.severity)}>
                          {pattern.severity}
                        </Badge>
                        <span className="text-sm text-gray-400">{pattern.confidence}%</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3">{pattern.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Velocidade:</span>
                          <span className="text-white">{pattern.metrics.liquidationVelocity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">L/S Ratio:</span>
                          <span className="text-white">{pattern.metrics.lsRatio.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cascade Prob:</span>
                          <span className="text-white">{(pattern.metrics.cascadeProbability * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Volume Spike:</span>
                          <span className="text-white">{pattern.metrics.volumeSpike.toFixed(1)}x</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Próxima direção:</span>
                        <span className={`font-medium ${
                          pattern.nextProbableDirection === 'LONG_LIQUIDATIONS' 
                            ? 'text-red-400' 
                            : 'text-green-400'
                        }`}>
                          {pattern.nextProbableDirection.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{pattern.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasData ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-8 h-8 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-300 mb-2">Aguardando Dados</h4>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      Conectando aos feeds de liquidação para iniciar análise de padrões...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-300 mb-2">Nenhum Padrão Detectado</h4>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      {activeFilter === 'all' 
                        ? 'O mercado está operando dentro dos padrões normais.' 
                        : `Nenhum padrão do tipo "${activeFilter}" foi identificado no momento.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
