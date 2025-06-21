
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiquidationData {
  asset: string;
  longs: number;
  shorts: number;
  velocity: number;
  ratio: number;
  volume: number;
  price: number;
  avgLongs: number;
  avgShorts: number;
  avgVelocity: number;
  avgVolume: number;
  longHistory: number[];
  shortHistory: number[];
  timestamp: string;
  previousVelocity?: number;
  acceleration?: number;
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
    const openAIApiKey =. env.get('OPENAI_API_KEY') || Deno.env.get('OpenAI');
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY não configurado');
      return new Response(
        JSON.stringify({ 
          error: 'OPENAI_API_KEY não configurado',
          detectedPatterns: [],
          marketSummary: { 
            dominantPattern: "CONFIG_ERROR", 
            overallRisk: "UNKNOWN", 
            recommendation: "Configure a API Key do OpenAI",
            confidence: 0
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
          recommendation: "Aguardando dados de liquidação",
          confidence: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🤖 [OPTIMIZED] Analisando ${unifiedAssets.length} ativos...`);

    // Preparar dados otimizados (comprimidos)
    const compressedData = unifiedAssets.map(asset => ({
      a: asset.asset,
      l: asset.longs,
      s: asset.shorts,
      v: asset.velocity,
      r: asset.ratio,
      vol: asset.volume,
      p: asset.price
    }));
    
    // Sistema ultra-otimizado com prompt mínimo
    const systemPrompt = `Analise liquidações cripto. Responda APENAS JSON:
{
  "detectedPatterns": [
    {
      "asset": "BTC",
      "pattern": "flip|cascade|squeeze|hunt|vacuum",
      "confidence": 85,
      "description": "descrição breve",
      "metrics": {"liquidationVelocity":1.5,"lsRatio":0.3,"cascadeProbability":0.75,"volumeSpike":2.1},
      "severity": "HIGH",
      "nextProbableDirection": "SHORT_LIQUIDATIONS",
      "reasoning": "motivo breve"
    }
  ],
  "marketSummary": {
    "dominantPattern": "flip",
    "overallRisk": "MEDIUM",
    "recommendation": "recomendação breve",
    "confidence": 0.78
  }
}

FOQUE EM:
- FLIP: Longs altos → Shorts começando
- CASCADE: Velocidade crescente
- SQUEEZE: Longs+Shorts simultâneos
- HUNT: Spike rápido + reversão
- VACUUM: Volume baixo + liquidações altas

Dados: ${JSON.stringify(compressedData)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.1,
        max_tokens: 800,
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
      const content = data.choices[0].message.content;
      // Limpar resposta se tiver markdown
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      aiAnalysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta da IA:', parseError);
      console.log('Resposta bruta:', data.choices[0].message.content);
      
      // Fallback response melhorado
      aiAnalysis = {
        detectedPatterns: [],
        marketSummary: { 
          dominantPattern: "PARSE_ERROR", 
          overallRisk: "LOW", 
          recommendation: "Erro no processamento - usando análise local",
          confidence: 0
        }
      };
    }
    
    // Garantir estrutura correta
    if (!aiAnalysis.detectedPatterns) aiAnalysis.detectedPatterns = [];
    if (!aiAnalysis.marketSummary) {
      aiAnalysis.marketSummary = {
        dominantPattern: "UNKNOWN",
        overallRisk: "LOW",
        recommendation: "Análise incompleta",
        confidence: 0
      };
    }
    
    console.log(`✨ IA detectou ${aiAnalysis.detectedPatterns?.length || 0} padrões otimizados`);
    
    return new Response(JSON.stringify(aiAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na análise otimizada:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        detectedPatterns: [],
        marketSummary: { 
          dominantPattern: "ERROR", 
          overallRisk: "LOW", 
          recommendation: `Usando fallback local: ${errorMessage}`,
          confidence: 0
        }
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
