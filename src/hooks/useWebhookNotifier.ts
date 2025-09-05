import { useEffect, useRef } from 'react';

// Enviar apenas array de pares

export const useWebhookNotifier = () => {
  const sentPairs = useRef<Set<string>>(new Set());
  const lastSentTime = useRef<number>(0);
  const WEBHOOK_URL = 'https://n8n-main.jpltec.com.br/webhook-test/1a4be5e1-22f7-49a7-a457-40c6b295842f';
  const THROTTLE_TIME = 5000; // 5 segundos entre envios

  const sendToWebhook = async (pairs: string[], source: string) => {
    const now = Date.now();
    
    // Throttle: não enviar se passou menos de 5 segundos
    if (now - lastSentTime.current < THROTTLE_TIME) {
      return;
    }

    // Filtrar apenas pares novos
    const newPairs = pairs.filter(pair => !sentPairs.current.has(pair));
    
    if (newPairs.length === 0) {
      return;
    }

    try {
      console.log(`🚀 ENVIANDO ${newPairs.length} pares para webhook:`, newPairs);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(newPairs), // Enviar apenas array de pares
      });

      // Marcar pares como enviados
      newPairs.forEach(pair => sentPairs.current.add(pair));
      lastSentTime.current = now;

      console.log(`✅ WEBHOOK: ${newPairs.length} pares enviados com sucesso`);
      
    } catch (error) {
      console.error('❌ ERRO ao enviar para webhook:', error);
    }
  };

  const notifyPairs = (assets: Array<{ asset: string }>, source: string) => {
    if (!assets || assets.length === 0) return;

    // Garantir que todos os pares terminam com USDT
    const pairs = assets.map(asset => {
      const assetName = asset.asset;
      return assetName.includes('USDT') ? assetName : `${assetName}USDT`;
    });

    // Remover duplicatas
    const uniquePairs = [...new Set(pairs)];

    if (uniquePairs.length > 0) {
      sendToWebhook(uniquePairs, source);
    }
  };

  // Função para limpar cache periodicamente (opcional)
  useEffect(() => {
    const interval = setInterval(() => {
      sentPairs.current.clear();
      console.log('🧹 WEBHOOK: Cache de pares limpo');
    }, 5 * 60 * 1000); // Limpar a cada 5 minutos

    return () => clearInterval(interval);
  }, []);

  return { notifyPairs };
};