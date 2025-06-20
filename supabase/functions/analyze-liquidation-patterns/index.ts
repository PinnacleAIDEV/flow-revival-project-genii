
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiquidationData {
  asset: string;
  longLiquidated: number;
  shortLiquidated: number;
  longPositions: number;
  shortPositions: number;
  price: number;
  marketCap: string;
  lastUpdateTime: string;
  liquidationHistory: Array<{
    type: 'long' | 'short';
    amount: number;
    timestamp: string;
    change24h: number;
  }>;
}

interface AnalysisRequest {
  unifiedAssets: LiquidationData[];
  timeWindowMinutes: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY não configurado');
      return new Response(
        JSON.stringify({ 
          error: 'OPENAI_API_KEY não configurado no Supabase',
          detectedPatterns: [],
          marketSummary: { 
            dominantPattern: "CONFIG_ERROR", 
            overallRisk: "UNKNOWN", 
            recommendation: "Configure a API Key do OpenAI no Supabase Edge Function Secrets" 
          }
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { unifiedAssets, timeWindowMinutes = 5 }: AnalysisRequest = await req.json();
    
    if (!unifiedAssets || unifiedAssets.length === 0) {
      console.log('⚠️ Nenhum asset recebido para análise');
      return new Response(JSON.stringify({
        detectedPatterns: [],
        marketSummary: { 
          dominantPattern: "NO_DATA", 
          overallRisk: "LOW", 
          recommendation: "Aguardando dados de liquidação" 
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🤖 Analisando ${unifiedAssets.length} ativos para padrões de liquidação...`);

    // Preparar dados para análise da IA
    const analysisData = prepareAnalysisData(unifiedAssets, timeWindowMinutes);
    
    const systemPrompt = `Você é um especialista em análise de liquidações de criptomoedas com foco em TREND REVERSAL DETECTION.
    
PADRÕES PARA DETECTAR (por ordem de prioridade):

1. **Liquidation Flip (ICEBERG)** - MAIS IMPORTANTE
   - Heavy liquidations de um lado → Parada súbita → Sudden liquidations do lado oposto
   - Exemplo: Muitas LONG liquidations param → Começam SHORT liquidations intensas
   - Indicador principal: Mudança abrupta de direção em < 3 minutos

2. **Liquidation Cascade** - Liquidações em cadeia na mesma direção com velocidade crescente
3. **Hunt & Liquidate** - Movimento pequeno → Trigger stops → Liquidação grande → Reversão  
4. **Squeeze Pattern** - Liquidações simultâneas LONG + SHORT (alta volatilidade)
5. **Stairway Liquidation** - Liquidações em níveis específicos (escada de preços)
6. **Liquidation Vacuum** - Liquidações pesadas → Sem resistência → Preço dispara
7. **Pendulum Liquidation** - Oscilação LONG → SHORT → LONG em timeframe maior
8. **Whale Liquidation** - Uma liquidação gigante → Choque → Cascade segue

MÉTRICAS CRÍTICAS:
- Liquidation Velocity = volume_liquidação / intervalo_tempo
- L/S Ratio = long_liquidations / short_liquidations  
- Cascade Probability = (liquidações_atuais / média_liquidações) × índice_volatilidade
- Sudden Stop Detection = Mudança > 80% no volume em < 2 minutos

FOQUE EM LIQUIDATION FLIPS - são o padrão mais valioso para trading.

RESPONDA EM JSON com esta estrutura EXATA:
{
  "detectedPatterns": [
    {
      "asset": "BTC",
      "pattern": "Liquidation Flip",
      "confidence": 85,
      "description": "Heavy LONG liquidations ($2.5M) pararam subitamente há 90s, seguidas por início intenso de SHORT liquidations ($1.8M). Indica possível reversão bullish.",
      "metrics": {
        "liquidationVelocity": 1.5,
        "lsRatio": 0.3,
        "cascadeProbability": 0.75
      },
      "timeframe": "3min",
      "severity": "HIGH",
      "nextProbableDirection": "SHORT_LIQUIDATIONS",
      "reasoning": "Padrão clássico de exaustão de longs seguido por pressure nos shorts - mercado pode estar revertendo para cima"
    }
  ],
  "marketSummary": {
    "dominantPattern": "Liquidation Flip",
    "overallRisk": "MEDIUM",
    "recommendation": "Monitorar continuação das SHORT liquidations - se persistirem por >5min, reversão confirmada"
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analise estes dados de liquidação focando em TREND REVERSALS:\n${JSON.stringify(analysisData, null, 2)}` }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Resposta inválida da OpenAI API');
    }
    
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta da IA:', parseError);
      console.log('Resposta bruta:', data.choices[0].message.content);
      
      // Fallback response
      aiAnalysis = {
        detectedPatterns: [],
        marketSummary: { 
          dominantPattern: "PARSE_ERROR", 
          overallRisk: "UNKNOWN", 
          recommendation: "Erro ao processar análise da IA" 
        }
      };
    }
    
    console.log(`✨ IA detectou ${aiAnalysis.detectedPatterns?.length || 0} padrões`);
    
    return new Response(JSON.stringify(aiAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na análise de IA:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        detectedPatterns: [],
        marketSummary: { 
          dominantPattern: "ERROR", 
          overallRisk: "UNKNOWN", 
          recommendation: `Erro na análise: ${errorMessage}` 
        }
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function prepareAnalysisData(unifiedAssets: LiquidationData[], timeWindowMinutes: number) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
  
  return unifiedAssets.map(asset => {
    // Filtrar histórico dentro da janela de tempo
    const recentHistory = asset.liquidationHistory.filter(h => 
      new Date(h.timestamp) > windowStart
    );
    
    // Calcular métricas
    const longVolume = recentHistory.filter(h => h.type === 'long').reduce((sum, h) => sum + h.amount, 0);
    const shortVolume = recentHistory.filter(h => h.type === 'short').reduce((sum, h) => sum + h.amount, 0);
    const totalVolume = longVolume + shortVolume;
    
    // Liquidation Velocity (volume por minuto)
    const liquidationVelocity = totalVolume / timeWindowMinutes;
    
    // L/S Ratio
    const lsRatio = shortVolume > 0 ? longVolume / shortVolume : longVolume > 0 ? 999 : 1;
    
    // Detectar paradas súbitas (períodos sem liquidação > 2 min)
    const suddenStops = detectSuddenStops(recentHistory);
    
    // Detectar mudanças abruptas de direção
    const directionChanges = detectDirectionChanges(recentHistory);
    
    return {
      asset: asset.asset,
      price: asset.price,
      marketCap: asset.marketCap,
      timeWindow: `${timeWindowMinutes}min`,
      liquidationVelocity: liquidationVelocity,
      lsRatio: lsRatio,
      totalVolume: totalVolume,
      longVolume: longVolume,
      shortVolume: shortVolume,
      longPositions: asset.longPositions,
      shortPositions: asset.shortPositions,
      recentHistory: recentHistory.slice(-10), // Últimas 10 liquidações
      suddenStops: suddenStops,
      directionChanges: directionChanges,
      dominantType: longVolume > shortVolume ? 'LONG' : 'SHORT',
      volatility: calculateVolatility(recentHistory)
    };
  });
}

function detectSuddenStops(history: any[]) {
  if (history.length < 2) return [];
  
  const stops = [];
  const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  for (let i = 1; i < sortedHistory.length; i++) {
    const timeDiff = new Date(sortedHistory[i].timestamp).getTime() - new Date(sortedHistory[i-1].timestamp).getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff > 2) { // Parada de mais de 2 minutos
      stops.push({
        duration: minutesDiff,
        beforeType: sortedHistory[i-1].type,
        afterType: sortedHistory[i].type,
        stopped: true
      });
    }
  }
  
  return stops;
}

function detectDirectionChanges(history: any[]) {
  if (history.length < 3) return [];
  
  const changes = [];
  const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Dividir em períodos de 2 minutos e verificar mudanças
  const periods = [];
  let currentPeriod = [];
  let periodStart = new Date(sortedHistory[0]?.timestamp || Date.now()).getTime();
  
  for (const item of sortedHistory) {
    const itemTime = new Date(item.timestamp).getTime();
    if (itemTime - periodStart > 2 * 60 * 1000) { // 2 minutos
      if (currentPeriod.length > 0) {
        periods.push(currentPeriod);
      }
      currentPeriod = [item];
      periodStart = itemTime;
    } else {
      currentPeriod.push(item);
    }
  }
  
  if (currentPeriod.length > 0) {
    periods.push(currentPeriod);
  }
  
  // Detectar mudanças entre períodos
  for (let i = 1; i < periods.length; i++) {
    const prevDominant = getDominantType(periods[i-1]);
    const currDominant = getDominantType(periods[i]);
    
    if (prevDominant !== currDominant && prevDominant !== 'BALANCED' && currDominant !== 'BALANCED') {
      changes.push({
        from: prevDominant,
        to: currDominant,
        strength: Math.abs(periods[i].length - periods[i-1].length)
      });
    }
  }
  
  return changes;
}

function getDominantType(period: any[]) {
  const longCount = period.filter(p => p.type === 'long').length;
  const shortCount = period.filter(p => p.type === 'short').length;
  
  if (longCount > shortCount * 1.5) return 'LONG';
  if (shortCount > longCount * 1.5) return 'SHORT';
  return 'BALANCED';
}

function calculateVolatility(history: any[]) {
  if (history.length < 2) return 0;
  
  const changes = history.map(h => h.change24h).filter(c => !isNaN(c));
  if (changes.length === 0) return 0;
  
  const mean = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  const variance = changes.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / changes.length;
  
  return Math.sqrt(variance);
}
