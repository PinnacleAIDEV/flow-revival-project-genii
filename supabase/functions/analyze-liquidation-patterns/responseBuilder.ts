
import { corsHeaders } from './constants.ts';
import { AIAnalysisResponse } from './types.ts';

export function buildSuccessResponse(aiAnalysis: AIAnalysisResponse): Response {
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
}

export function buildErrorResponse(errorMessage: string, statusCode: number = 500): Response {
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
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

export function buildCorsResponse(): Response {
  return new Response(null, { headers: corsHeaders });
}
