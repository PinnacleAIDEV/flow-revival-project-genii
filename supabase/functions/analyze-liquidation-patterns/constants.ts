
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const OPENAI_CONFIG = {
  model: 'gpt-4.1-2025-04-14',
  temperature: 0.1,
  max_tokens: 800,
} as const;

export const SYSTEM_PROMPT = `Analise liquidações cripto. Responda APENAS JSON:
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
- VACUUM: Volume baixo + liquidações altas`;
