
import { useState, useEffect, useCallback } from 'react';
import { getTimeUntilReset, formatTimeUntilReset, shouldResetData, getDailyResetTime } from '../utils/dailyReset';

interface DailyResetHook {
  timeUntilReset: string;
  isResetting: boolean;
  lastResetTime: string | null;
  forceReset: () => void;
}

export const useDailyReset = (onReset?: () => void): DailyResetHook => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('00:00:00');
  const [isResetting, setIsResetting] = useState(false);
  const [lastResetTime, setLastResetTime] = useState<string | null>(
    localStorage.getItem('lastDailyReset')
  );

  const performReset = useCallback(async () => {
    setIsResetting(true);
    console.log('🔄 Iniciando reset diário às 00:00 UTC');
    
    try {
      // Limpar dados locais
      const keysToPreserve = ['lastDailyReset'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Atualizar timestamp do último reset
      const resetTime = getDailyResetTime().toISOString();
      localStorage.setItem('lastDailyReset', resetTime);
      setLastResetTime(resetTime);

      // Chamar callback customizado se fornecido
      if (onReset) {
        await onReset();
      }

      console.log('✅ Reset diário concluído');
    } catch (error) {
      console.error('❌ Erro durante reset diário:', error);
    } finally {
      setIsResetting(false);
    }
  }, [onReset]);

  const forceReset = useCallback(() => {
    performReset();
  }, [performReset]);

  useEffect(() => {
    // Verificar se precisa fazer reset na inicialização
    if (shouldResetData(lastResetTime)) {
      performReset();
    }

    // Configurar timer para atualizar contador a cada segundo
    const interval = setInterval(() => {
      const timeLeft = formatTimeUntilReset();
      setTimeUntilReset(timeLeft);

      // Verificar se é hora de fazer reset
      if (shouldResetData(lastResetTime)) {
        performReset();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastResetTime, performReset]);

  return {
    timeUntilReset,
    isResetting,
    lastResetTime,
    forceReset
  };
};
