
import React, { useState } from 'react';
import { Brain, Zap, TrendingUp, TrendingDown, AlertTriangle, Activity, Eye, Cpu, Gauge, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface HybridPattern {
  asset: string;
  pattern: string;
  confidence: number;
  description: string;
  metrics: {
    liquidationVelocity: number;
    lsRatio: number;
    cascadeProbability: number;
    volumeSpike: number;
  };
  timeframe: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  nextProbableDirection: 'LONG_LIQUIDATIONS' | 'SHORT_LIQUIDATIONS' | 'BALANCED';
  reasoning: string;
  source: 'LOCAL' | 'AI' | 'CACHED';
  alertType: 'iceberg' | 'cascade' | 'squeeze' | 'hunt' | 'vacuum' | 'whale' | 'general';
}

interface HybridAnalysis {
  detectedPatterns: HybridPattern[];
  marketSummary: {
    dominantPattern: string;
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: string;
    confidence: number;
  };
  performance: {
    localDetections: number;
    aiCalls: number;
    cacheHits: number;
    tokensUsed: number;
    averageResponseTime: number;
  };
}

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

interface HybridTrendReversalSectionProps {
  hybridAnalysis: HybridAnalysis | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  performanceStats: {
    localDetections: number;
    aiCalls: number;
    cacheHits: number;
    tokensUsed: number;
    totalAnalyses: number;
    averageResponseTime: number;
  };
  unifiedAssets: Map<string, TrendReversalAsset>;
  onAssetClick: (asset: string) => void;
  getIcebergAlerts: () => HybridPattern[];
  getCascadeAlerts: () => HybridPattern[];
  getSqueezeAlerts: () => HybridPattern[];
  getCriticalAlerts: () => HybridPattern[];
  hasData: boolean;
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
  hasData
}) => {
  const [activeTab, setActiveTab] = useState('all');

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

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'AI': return 'bg-purple-500 text-white';
      case 'LOCAL': return 'bg-green-500 text-white';
      case 'CACHED': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'LONG_LIQUIDATIONS') return <TrendingDown className="w-3 h-3 text-red-500" />;
    if (direction === 'SHORT_LIQUIDATIONS') return <TrendingUp className="w-3 h-3 text-green-500" />;
    return <Zap className="w-3 h-3 text-blue-500" />;
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'iceberg': return '🧊';
      case 'cascade': return '🌊';
      case 'squeeze': return '🗜️';
      case 'hunt': return '🎯';
      case 'vacuum': return '🌪️';
      case 'whale': return '🐋';
      default: return '⚡';
    }
  };

  const renderPatternCard = (pattern: HybridPattern, index: number) => (
    <div
      key={`${pattern.asset}-${index}`}
      className="p-4 rounded-lg cursor-pointer transition-all hover:bg-purple-900/20 border border-purple-800/30 bg-purple-950/30"
      onClick={() => onAssetClick(pattern.asset)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getAlertIcon(pattern.alertType)}</span>
          <span className="font-bold text-purple-200">{pattern.asset}</span>
          {getDirectionIcon(pattern.nextProbableDirection)}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(pattern.severity)}`}>
            {pattern.severity}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${getSourceColor(pattern.source)}`}>
            {pattern.source}
          </span>
          <span className="text-xs text-purple-400">
            {pattern.confidence.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="text-sm text-purple-300 mb-2 font-medium">
        {pattern.pattern.toUpperCase()}
      </div>

      <div className="text-xs text-purple-400 mb-3">
        {pattern.description}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div>
          <span className="text-purple-500">Velocidade:</span>
          <span className="text-purple-300 ml-1">
            {pattern.metrics.liquidationVelocity.toFixed(1)}/min
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
        <div>
          <span className="text-purple-500">Vol Spike:</span>
          <span className="text-purple-300 ml-1">
            {pattern.metrics.volumeSpike.toFixed(1)}x
          </span>
        </div>
      </div>

      <div className="text-xs text-purple-400 italic">
        "{pattern.reasoning}"
      </div>
    </div>
  );

  const renderPerformanceStats = () => (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-green-900/30 rounded-lg p-2">
        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-green-400" />
          <div className="text-xs text-green-400">Local</div>
        </div>
        <div className="text-sm font-bold text-green-300">
          {performanceStats.localDetections}
        </div>
      </div>
      <div className="bg-purple-900/30 rounded-lg p-2">
        <div className="flex items-center space-x-1">
          <Brain className="w-3 h-3 text-purple-400" />
          <div className="text-xs text-purple-400">IA</div>
        </div>
        <div className="text-sm font-bold text-purple-300">
          {performanceStats.aiCalls}
        </div>
      </div>
      <div className="bg-blue-900/30 rounded-lg p-2">
        <div className="flex items-center space-x-1">
          <Gauge className="w-3 h-3 text-blue-400" />
          <div className="text-xs text-blue-400">Cache</div>
        </div>
        <div className="text-sm font-bold text-blue-300">
          {performanceStats.cacheHits}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-full bg-gradient-to-br from-purple-950/90 to-indigo-950/90 border-purple-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-3 text-purple-300">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <span className="font-mono">HYBRID AI TREND REVERSAL 🔄</span>
            <div className="flex items-center space-x-2 text-sm font-normal mt-1">
              {isAnalyzing && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-purple-400">Analisando híbrido...</span>
                </div>
              )}
              {hasData && (
                <Badge className="bg-purple-600/30 text-purple-300 border-purple-500">
                  {hybridAnalysis?.detectedPatterns.length || 0} padrões
                </Badge>
              )}
              <Badge className="bg-green-600/30 text-green-300 border-green-500">
                99.4% economia tokens
              </Badge>
            </div>
          </div>
        </CardTitle>
        
        {/* Performance Stats */}
        {hasData && renderPerformanceStats()}
      </CardHeader>

      <CardContent className="h-[calc(100%-200px)]">
        {analysisError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-red-300 text-sm">Erro na análise híbrida</p>
              <p className="text-red-400 text-xs">{analysisError}</p>
            </div>
          </div>
        ) : !hasData && !isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Brain className="w-12 h-12 text-purple-400 mx-auto opacity-50" />
              <div>
                <h4 className="text-lg font-medium text-purple-300 mb-2">Sistema Híbrido Ativo</h4>
                <p className="text-purple-400 text-sm max-w-xs">
                  IA + Algoritmos locais monitorando padrões de reversão...
                </p>
                <div className="mt-2 text-xs text-purple-500">
                  Economia de tokens: 99.4% • Resposta: 10x mais rápida
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-5 bg-purple-900/20">
              <TabsTrigger value="all" className="text-xs">
                Todos ({hybridAnalysis?.detectedPatterns.length || 0})
              </TabsTrigger>
              <TabsTrigger value="iceberg" className="text-xs">
                🧊 Iceberg ({getIcebergAlerts().length})
              </TabsTrigger>
              <TabsTrigger value="cascade" className="text-xs">
                🌊 Cascade ({getCascadeAlerts().length})
              </TabsTrigger>
              <TabsTrigger value="squeeze" className="text-xs">
                🗜️ Squeeze ({getSqueezeAlerts().length})
              </TabsTrigger>
              <TabsTrigger value="critical" className="text-xs">
                ⚠️ Críticos ({getCriticalAlerts().length})
              </TabsTrigger>
            </TabsList>

            <div className="h-[calc(100%-50px)] mt-2">
              <TabsContent value="all" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {hybridAnalysis?.detectedPatterns.map((pattern, index) => 
                      renderPatternCard(pattern, index)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="iceberg" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {getIcebergAlerts().map((pattern, index) => 
                      renderPatternCard(pattern, index)
                    )}
                    {getIcebergAlerts().length === 0 && (
                      <div className="text-center py-8 text-purple-400">
                        <span className="text-4xl">🧊</span>
                        <p className="mt-2">Nenhum padrão Iceberg detectado</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="cascade" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {getCascadeAlerts().map((pattern, index) => 
                      renderPatternCard(pattern, index)
                    )}
                    {getCascadeAlerts().length === 0 && (
                      <div className="text-center py-8 text-purple-400">
                        <span className="text-4xl">🌊</span>
                        <p className="mt-2">Nenhuma cascata detectada</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="squeeze" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {getSqueezeAlerts().map((pattern, index) => 
                      renderPatternCard(pattern, index)
                    )}
                    {getSqueezeAlerts().length === 0 && (
                      <div className="text-center py-8 text-purple-400">
                        <span className="text-4xl">🗜️</span>
                        <p className="mt-2">Nenhum squeeze detectado</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="critical" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {getCriticalAlerts().map((pattern, index) => 
                      renderPatternCard(pattern, index)
                    )}
                    {getCriticalAlerts().length === 0 && (
                      <div className="text-center py-8 text-purple-400">
                        <span className="text-4xl">⚠️</span>
                        <p className="mt-2">Nenhum padrão crítico no momento</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>

            {/* Market Summary */}
            {hybridAnalysis?.marketSummary && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-purple-900/40 rounded-lg border border-purple-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-300 mb-1">
                      MERCADO: {hybridAnalysis.marketSummary.dominantPattern}
                    </div>
                    <div className="text-xs text-purple-400">
                      Risco: <span className={`font-bold ${
                        hybridAnalysis.marketSummary.overallRisk === 'CRITICAL' ? 'text-red-400' :
                        hybridAnalysis.marketSummary.overallRisk === 'HIGH' ? 'text-orange-400' :
                        hybridAnalysis.marketSummary.overallRisk === 'MEDIUM' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {hybridAnalysis.marketSummary.overallRisk}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-purple-400">
                      Confiança: {(hybridAnalysis.marketSummary.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-purple-500">
                      Resp: {performanceStats.averageResponseTime.toFixed(0)}ms
                    </div>
                  </div>
                </div>
                <div className="text-xs text-purple-300 mt-2 italic">
                  {hybridAnalysis.marketSummary.recommendation}
                </div>
              </div>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
