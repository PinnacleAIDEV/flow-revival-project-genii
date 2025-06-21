
import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Zap, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { formatAmount } from '../../utils/liquidationUtils';
import { UnifiedTrendReversalAsset } from '../../types/trendReversal';

interface LiquidationPattern {
  id: string;
  asset: string;
  patternType: 'CASCADE' | 'FLIP' | 'SQUEEZE' | 'HUNT' | 'STAIRWAY' | 'VACUUM' | 'PENDULUM' | 'WHALE';
  description: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  timestamp: Date;
  data: {
    longVolume: number;
    shortVolume: number;
    priceMove?: number;
    timespan?: number;
  };
}

interface SimplifiedTrendReversalSectionProps {
  unifiedAssets: Map<string, UnifiedTrendReversalAsset>;
  onAssetClick: (asset: string) => void;
  isRealData: boolean;
  professionalData: boolean;
}

export const SimplifiedTrendReversalSection: React.FC<SimplifiedTrendReversalSectionProps> = ({
  unifiedAssets,
  onAssetClick,
  isRealData,
  professionalData
}) => {
  const [detectedPatterns, setDetectedPatterns] = useState<LiquidationPattern[]>([]);
  const [assetTimeline, setAssetTimeline] = useState<Map<string, UnifiedTrendReversalAsset[]>>(new Map());

  // Manter histórico simplificado de assets (últimas 3 snapshots apenas)
  useEffect(() => {
    if (unifiedAssets.size === 0) return;

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    setAssetTimeline(prev => {
      const newTimeline = new Map(prev);
      
      unifiedAssets.forEach((asset, assetName) => {
        const history = newTimeline.get(assetName) || [];
        
        // Limpar histórico antigo
        const recentHistory = history.filter(h => h.lastUpdateTime > fiveMinutesAgo);
        
        // Adicionar nova snapshot se significativo
        const lastSnapshot = recentHistory[recentHistory.length - 1];
        const shouldAdd = !lastSnapshot || 
          Math.abs(lastSnapshot.combinedTotal - asset.combinedTotal) > 10000 || // $10K difference
          lastSnapshot.dominantType !== asset.dominantType;

        if (shouldAdd) {
          recentHistory.push(asset);
          
          // Manter apenas últimas 3 snapshots
          const trimmed = recentHistory.slice(-3);
          newTimeline.set(assetName, trimmed);
        }
      });

      return newTimeline;
    });
  }, [unifiedAssets]);

  // Detectar padrões de liquidação (SEM IA)
  const detectLiquidationPatterns = useMemo(() => {
    const patterns: LiquidationPattern[] = [];
    const now = new Date();

    assetTimeline.forEach((history, assetName) => {
      if (history.length < 2) return;

      const current = history[history.length - 1];
      const previous = history[history.length - 2];
      const beforePrevious = history.length >= 3 ? history[history.length - 3] : null;

      // 1. LIQUIDATION FLIP (Iceberg Pattern)
      if (previous.dominantType !== current.dominantType) {
        const prevVolume = previous.dominantType === 'long' ? previous.longLiquidated : previous.shortLiquidated;
        const currVolume = current.dominantType === 'long' ? current.longLiquidated : current.shortLiquidated;
        
        if (prevVolume > 25000 && currVolume > 25000) { // Mínimo $25K em cada lado
          patterns.push({
            id: `${assetName}-flip-${now.getTime()}`,
            asset: assetName,
            patternType: 'FLIP',
            description: `Liquidation Flip: ${previous.dominantType.toUpperCase()} → ${current.dominantType.toUpperCase()}`,
            confidence: Math.min(95, 50 + (Math.min(prevVolume, currVolume) / 1000)),
            severity: currVolume > 100000 ? 'EXTREME' : currVolume > 50000 ? 'HIGH' : 'MEDIUM',
            timestamp: current.lastUpdateTime,
            data: {
              longVolume: current.longLiquidated,
              shortVolume: current.shortLiquidated
            }
          });
        }
      }

      // 2. LIQUIDATION CASCADE (mesma direção crescente)
      if (beforePrevious && 
          beforePrevious.dominantType === previous.dominantType && 
          previous.dominantType === current.dominantType) {
        
        const vol1 = beforePrevious.dominantType === 'long' ? beforePrevious.longLiquidated : beforePrevious.shortLiquidated;
        const vol2 = previous.dominantType === 'long' ? previous.longLiquidated : previous.shortLiquidated;
        const vol3 = current.dominantType === 'long' ? current.longLiquidated : current.shortLiquidated;
        
        if (vol1 < vol2 && vol2 < vol3 && vol3 > 30000) { // Cascata crescente > $30K
          patterns.push({
            id: `${assetName}-cascade-${now.getTime()}`,
            asset: assetName,
            patternType: 'CASCADE',
            description: `Liquidation Cascade: ${current.dominantType.toUpperCase()} em aceleração`,
            confidence: Math.min(90, 60 + ((vol3 - vol1) / 1000)),
            severity: vol3 > 200000 ? 'EXTREME' : vol3 > 100000 ? 'HIGH' : 'MEDIUM',
            timestamp: current.lastUpdateTime,
            data: {
              longVolume: current.longLiquidated,
              shortVolume: current.shortLiquidated
            }
          });
        }
      }

      // 3. SQUEEZE PATTERN (high volume em ambos os lados)
      if (current.longLiquidated > 40000 && current.shortLiquidated > 40000) {
        const ratio = Math.min(current.longLiquidated, current.shortLiquidated) / Math.max(current.longLiquidated, current.shortLiquidated);
        
        if (ratio > 0.6) { // Volumes equilibrados (diferença < 40%)
          patterns.push({
            id: `${assetName}-squeeze-${now.getTime()}`,
            asset: assetName,
            patternType: 'SQUEEZE',
            description: `Squeeze Pattern: Liquidações bilaterais intensas`,
            confidence: Math.min(85, 40 + (ratio * 50)),
            severity: (current.longLiquidated + current.shortLiquidated) > 200000 ? 'EXTREME' : 'HIGH',
            timestamp: current.lastUpdateTime,
            data: {
              longVolume: current.longLiquidated,
              shortVolume: current.shortLiquidated
            }
          });
        }
      }

      // 4. WHALE LIQUIDATION (volume extremo de uma vez)
      const maxVolume = Math.max(current.longLiquidated, current.shortLiquidated);
      if (maxVolume > 500000) { // Whale = $500K+
        patterns.push({
          id: `${assetName}-whale-${now.getTime()}`,
          asset: assetName,
          patternType: 'WHALE',
          description: `Whale Liquidation: ${maxVolume === current.longLiquidated ? 'LONG' : 'SHORT'} massiva`,
          confidence: Math.min(95, 70 + (maxVolume / 10000)),
          severity: 'EXTREME',
          timestamp: current.lastUpdateTime,
          data: {
            longVolume: current.longLiquidated,
            shortVolume: current.shortLiquidated
          }
        });
      }
    });

    // Ordenar por severidade e timestamp
    return patterns
      .sort((a, b) => {
        const severityOrder = { 'EXTREME': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, 15); // Máximo 15 padrões
  }, [assetTimeline]);

  useEffect(() => {
    setDetectedPatterns(detectLiquidationPatterns);
  }, [detectLiquidationPatterns]);

  const getSeverityColor = (severity: string) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800 border-blue-300',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
      'EXTREME': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[severity as keyof typeof colors] || colors['LOW'];
  };

  const getPatternIcon = (patternType: string) => {
    const icons = {
      'CASCADE': Activity,
      'FLIP': RefreshCw,
      'SQUEEZE': AlertTriangle,
      'HUNT': Zap,
      'STAIRWAY': TrendingDown,
      'VACUUM': TrendingUp,
      'PENDULUM': RefreshCw,
      'WHALE': Activity
    };
    const IconComponent = icons[patternType as keyof typeof icons] || Activity;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="h-full">
      <Card className="bg-gray-900/90 backdrop-blur-sm border-purple-500 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2 text-purple-400 font-mono">
                  <span>PATTERN DETECTOR</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {detectedPatterns.length} padrões
                  </Badge>
                  {professionalData && (
                    <Badge className="bg-green-600 text-white">
                      REAL DATA
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  Detecta padrões de liquidação sem IA - Algoritmo Nativo v1.0
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-120px)]">
          {detectedPatterns.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-3 p-4">
                {detectedPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="p-4 rounded-lg border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-25 hover:from-purple-100 hover:to-purple-50 transition-all cursor-pointer"
                    onClick={() => onAssetClick(pattern.asset)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getPatternIcon(pattern.patternType)}
                          <span className="font-bold text-gray-900 text-lg">{pattern.asset}</span>
                          <Badge variant="outline" className="text-xs font-bold">
                            {pattern.patternType}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-purple-600">
                          {pattern.confidence}% conf
                        </span>
                        <span className={`px-2 py-1 rounded border text-xs font-bold ${getSeverityColor(pattern.severity)}`}>
                          {pattern.severity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 font-medium">{pattern.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">LONG Volume:</span>
                          <span className="font-mono text-red-600 font-bold">
                            {formatAmount(pattern.data.longVolume)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">SHORT Volume:</span>
                          <span className="font-mono text-green-600 font-bold">
                            {formatAmount(pattern.data.shortVolume)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          Padrão detectado às:
                        </span>
                        <span className="text-gray-500">
                          {new Intl.DateTimeFormat('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          }).format(pattern.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Analisando Padrões</h4>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Aguardando dados suficientes para detectar padrões de liquidação...
                  </p>
                  {professionalData && (
                    <div className="mt-3 space-y-1">
                      <p className="text-purple-600 text-xs font-semibold">
                        Real Force Order Data
                      </p>
                      <p className="text-gray-400 text-xs">
                        Assets: {unifiedAssets.size} • Timeline: {assetTimeline.size} • Filtro: $20K-50K+
                      </p>
                    </div>
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
