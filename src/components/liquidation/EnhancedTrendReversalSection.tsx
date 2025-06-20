
import React from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Zap, AlertTriangle, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { TrendReversal } from '../../types/liquidation';
import { formatAmount } from '../../utils/liquidationUtils';

interface EnhancedTrendReversalSectionProps {
  trendReversals: TrendReversal[];
  onAssetClick: (asset: string) => void;
}

export const EnhancedTrendReversalSection: React.FC<EnhancedTrendReversalSectionProps> = ({
  trendReversals,
  onAssetClick
}) => {
  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const getIntensityColor = (intensity: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-yellow-100 text-yellow-800', 
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-purple-100 text-purple-800'
    };
    return colors[intensity as keyof typeof colors] || colors[1];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    if (confidence >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="h-full">
      <Card className="bg-gray-900/90 backdrop-blur-sm border-purple-500 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2 text-purple-400 font-mono">
                  <span>ENHANCED TREND REVERSAL</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {trendReversals.length} reversals
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  Detecção avançada de mudanças de sentimento com análise de posições
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-120px)]">
          {trendReversals.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                {trendReversals.map((reversal, index) => (
                  <div
                    key={`${reversal.asset}-${reversal.timestamp.getTime()}`}
                    className="p-4 rounded-lg border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-25 hover:from-purple-100 hover:to-purple-50 transition-all cursor-pointer"
                    onClick={() => onAssetClick(reversal.asset)}
                  >
                    {/* Header com direção da reversão */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {reversal.previousType === 'long' ? (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          )}
                          <Zap className="w-5 h-5 text-purple-600" />
                          {reversal.currentType === 'long' ? (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <span className="font-bold text-gray-900 text-lg">{reversal.asset}</span>
                        <Badge variant="outline" className="text-xs font-bold">
                          {reversal.reversalRatio.toFixed(2)}x
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(reversal.intensity)}`}>
                          I-{reversal.intensity}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          reversal.marketCap === 'high' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {reversal.marketCap === 'high' ? 'HIGH CAP' : 'LOW CAP'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Análise de sentimento */}
                    <div className="mb-3 p-3 bg-white rounded-lg border">
                      <div className="flex items-start space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Análise de Sentimento</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${getConfidenceColor(reversal.sentimentShift.confidence)}`}>
                              {reversal.sentimentShift.confidence}% confiança
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {reversal.sentimentShift.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Indicadores */}
                      <div className="space-y-1">
                        {reversal.sentimentShift.indicators.map((indicator, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                            <span className="text-xs text-gray-600">{indicator}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Dados de comparação */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="space-y-2">
                        <div className="font-medium text-gray-700 flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>Período Anterior ({reversal.timeframe})</span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Direção:</span>
                            <span className={`font-bold ${reversal.previousType === 'long' ? 'text-red-600' : 'text-green-600'}`}>
                              {reversal.previousType.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600">Volume:</span>
                            <span className="font-mono text-gray-700">{formatAmount(reversal.previousVolume)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600">Posições:</span>
                            <span className="text-gray-700">
                              L:{reversal.positionsCount.previousPeriod.long} / S:{reversal.positionsCount.previousPeriod.short}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="font-medium text-gray-700 flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span>Período Atual</span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Direção:</span>
                            <span className={`font-bold ${reversal.currentType === 'long' ? 'text-red-600' : 'text-green-600'}`}>
                              {reversal.currentType.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600">Volume:</span>
                            <span className="font-mono text-purple-600 font-bold">{formatAmount(reversal.currentVolume)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600">Posições:</span>
                            <span className="text-purple-600 font-bold">
                              L:{reversal.positionsCount.currentPeriod.long} / S:{reversal.positionsCount.currentPeriod.short}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer com dados técnicos */}
                    <div className="pt-3 border-t border-purple-200">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-500">
                            Preço: {formatPrice(reversal.price)}
                          </span>
                          <span className="text-gray-500">
                            Janela: {reversal.timeframe}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Intl.DateTimeFormat('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            }).format(reversal.timestamp)}
                          </span>
                        </div>
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
                  <RefreshCw className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Analisando Reversões</h4>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Monitorando mudanças de direção nas liquidações com análise avançada de posições e sentimento...
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
