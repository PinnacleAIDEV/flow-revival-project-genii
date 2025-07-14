import React from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Zap, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { formatAmount } from '../../utils/liquidationUtils';
import { useOptimizedTrendReversal } from '../../hooks/useOptimizedTrendReversal';

interface OptimizedTrendReversalSectionProps {
  onAssetClick: (asset: string) => void;
}

export const OptimizedTrendReversalSection: React.FC<OptimizedTrendReversalSectionProps> = ({
  onAssetClick
}) => {
  const { signals, totalAssets, totalSignals, highSeveritySignals } = useOptimizedTrendReversal();

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
      'WHALE': Activity,
      'MOMENTUM_SHIFT': TrendingUp
    };
    const IconComponent = icons[patternType as keyof typeof icons] || Activity;
    return <IconComponent className="w-4 h-4" />;
  };

  const getPatternColor = (patternType: string) => {
    const colors = {
      'FLIP': 'text-purple-600',
      'CASCADE': 'text-red-600',
      'SQUEEZE': 'text-orange-600',
      'WHALE': 'text-blue-600',
      'MOMENTUM_SHIFT': 'text-green-600'
    };
    return colors[patternType as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="h-full">
      <Card className="bg-gray-900/90 backdrop-blur-sm border-purple-500 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-400 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2 text-purple-400 font-mono">
                  <span>OPTIMIZED TREND REVERSAL</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {totalSignals} sinais
                  </Badge>
                  <Badge className="bg-green-600 text-white">
                    REAL DATA
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  {totalAssets} ativos • {highSeveritySignals} high/extreme • Throttle 5min
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-120px)]">
          {signals.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-3 p-4">
                {signals.map((signal) => (
                  <div
                    key={signal.id}
                    className="p-4 rounded-lg border-l-4 border-purple-500 bg-gradient-to-r from-gray-50 to-gray-25 hover:from-gray-100 hover:to-gray-50 transition-all cursor-pointer"
                    onClick={() => onAssetClick(signal.asset)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={getPatternColor(signal.patternType)}>
                            {getPatternIcon(signal.patternType)}
                          </div>
                          <span className="font-bold text-gray-900 text-lg">{signal.asset}</span>
                          <Badge variant="outline" className={`text-xs font-bold ${getPatternColor(signal.patternType)}`}>
                            {signal.patternType}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-purple-600">
                          {signal.confidence.toFixed(0)}%
                        </span>
                        <span className={`px-2 py-1 rounded border text-xs font-bold ${getSeverityColor(signal.severity)}`}>
                          {signal.severity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 font-medium">{signal.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">LONG:</span>
                          <span className="font-mono text-red-600 font-bold">
                            {formatAmount(signal.data.longVolume)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">SHORT:</span>
                          <span className="font-mono text-green-600 font-bold">
                            {formatAmount(signal.data.shortVolume)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dominante:</span>
                          <span className={`font-mono font-bold ${
                            signal.data.dominantType === 'long' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {signal.data.dominantType.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ratio:</span>
                        <span className="font-mono text-gray-700">
                          {signal.data.volumeRatio.toFixed(2)}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Intensidade:</span>
                        <span className="font-mono text-gray-700">
                          {signal.data.intensity}/10
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          Detectado às:
                        </span>
                        <span className="text-gray-500 font-mono">
                          {new Intl.DateTimeFormat('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }).format(signal.timestamp)}
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
                    Aguardando dados suficientes para detectar reversões de tendência...
                  </p>
                  <div className="mt-3 space-y-1">
                    <p className="text-purple-600 text-xs font-semibold">
                      Sistema Otimizado
                    </p>
                    <p className="text-gray-400 text-xs">
                      {totalAssets} ativos monitorados • Detecção inteligente de padrões
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};