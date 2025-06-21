
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { AnalysisRequest } from './types.ts';
import { callOpenAI } from './openaiService.ts';
import { createFallbackResponse, createNoDataResponse, createConfigErrorResponse } from './dataProcessor.ts';
import { buildSuccessResponse, buildErrorResponse, buildCorsResponse } from './responseBuilder.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return buildCorsResponse();
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OpenAI');
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY não configurado');
      return buildErrorResponse(
        JSON.stringify(createConfigErrorResponse()), 
        500
      );
    }

    const { unifiedAssets, timeWindowMinutes = 5 }: AnalysisRequest = await req.json();
    
    if (!unifiedAssets || unifiedAssets.length === 0) {
      console.log('⚠️ Nenhum asset recebido para análise');
      return new Response(JSON.stringify(createNoDataResponse()), {
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🤖 [OPTIMIZED] Analisando ${unifiedAssets.length} ativos...`);

    const aiAnalysis = await callOpenAI(openAIApiKey, unifiedAssets);
    
    return buildSuccessResponse(aiAnalysis);

  } catch (error) {
    console.error('❌ Erro na análise otimizada:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return buildErrorResponse(errorMessage);
  }
});
