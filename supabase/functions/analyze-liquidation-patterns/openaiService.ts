
import { OPENAI_CONFIG, SYSTEM_PROMPT } from './constants.ts';
import { LiquidationData, AIAnalysisResponse } from './types.ts';
import { compressData } from './dataProcessor.ts';

export async function callOpenAI(
  openAIApiKey: string, 
  unifiedAssets: LiquidationData[]
): Promise<AIAnalysisResponse> {
  const compressedData = compressData(unifiedAssets);
  const promptWithData = `${SYSTEM_PROMPT}\n\nDados: ${JSON.stringify(compressedData)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_CONFIG.model,
      messages: [
        { role: 'user', content: promptWithData }
      ],
      temperature: OPENAI_CONFIG.temperature,
      max_tokens: OPENAI_CONFIG.max_tokens,
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

  return parseAIResponse(data.choices[0].message.content);
}

function parseAIResponse(content: string): AIAnalysisResponse {
  try {
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (parseError) {
    console.error('❌ Erro ao fazer parse da resposta da IA:', parseError);
    console.log('Resposta bruta:', content);
    
    throw new Error('Erro no parse da resposta da IA');
  }
}
