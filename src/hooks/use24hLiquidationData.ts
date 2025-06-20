
import { useState, useEffect, useCallback } from 'react';
import { useDailyReset } from './useDailyReset';
import { LiquidationBubble } from '../types/liquidation';
import { formatAmount } from '../utils/liquidationUtils';

export interface DailyLiquidationTotal {
  asset: string;
  ticker: string;
  longTotal: number;
  shortTotal: number;
  totalLiquidated: number;
  lastUpdate: Date;
  marketCap: 'high' | 'low';
}

export const use24hLiquidationData = () => {
  const [dailyTotals, setDailyTotals] = useState<DailyLiquidationTotal[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Usar reset diário para limpar dados às 00:00 UTC
  const { timeUntilReset } = useDailyReset(useCallback(() => {
    console.log('🔄 Resetando totais 24h de liquidações...');
    setDailyTotals([]);
    localStorage.removeItem('dailyLiquidationTotals');
    setLastUpdateTime(new Date());
  }, []));

  // Carregar dados persistidos na inicialização
  useEffect(() => {
    const stored = localStorage.getItem('dailyLiquidationTotals');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const restored = parsed.map((item: any) => ({
          ...item,
          lastUpdate: new Date(item.lastUpdate)
        }));
        setDailyTotals(restored);
        console.log(`📊 Carregados ${restored.length} totais 24h do localStorage`);
      } catch (error) {
        console.error('Erro ao carregar totais 24h:', error);
      }
    }
  }, []);

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    if (dailyTotals.length > 0) {
      localStorage.setItem('dailyLiquidationTotals', JSON.stringify(dailyTotals));
    }
  }, [dailyTotals]);

  // Função para adicionar liquidação ao total 24h - usando useCallback para evitar re-renders
  const addLiquidationToDaily = useCallback((liquidation: LiquidationBubble) => {
    setDailyTotals(prev => {
      const existing = prev.find(item => item.asset === liquidation.asset);
      const now = new Date();
      
      if (existing) {
        // Atualizar totais existentes
        return prev.map(item => {
          if (item.asset === liquidation.asset) {
            return {
              ...item,
              longTotal: liquidation.type === 'long' 
                ? item.longTotal + liquidation.amount 
                : item.longTotal,
              shortTotal: liquidation.type === 'short' 
                ? item.shortTotal + liquidation.amount 
                : item.shortTotal,
              totalLiquidated: liquidation.type === 'long' 
                ? item.totalLiquidated + liquidation.amount
                : item.totalLiquidated + liquidation.amount,
              lastUpdate: now
            };
          }
          return item;
        });
      } else {
        // Criar novo registro
        const newTotal: DailyLiquidationTotal = {
          asset: liquidation.asset,
          ticker: liquidation.asset + 'USDT',
          longTotal: liquidation.type === 'long' ? liquidation.amount : 0,
          shortTotal: liquidation.type === 'short' ? liquidation.amount : 0,
          totalLiquidated: liquidation.amount,
          lastUpdate: now,
          marketCap: liquidation.marketCap
        };
        
        return [...prev, newTotal].sort((a, b) => b.totalLiquidated - a.totalLiquidated);
      }
    });
    
    setLastUpdateTime(new Date());
  }, []);

  // Obter top ativos por categoria
  const getTopByCategory = useCallback((category: 'high' | 'low', limit: number = 10) => {
    return dailyTotals
      .filter(item => item.marketCap === category)
      .slice(0, limit);
  }, [dailyTotals]);

  // Estatísticas gerais
  const stats = {
    totalAssets: dailyTotals.length,
    totalLiquidated: dailyTotals.reduce((sum, item) => sum + item.totalLiquidated, 0),
    totalLongLiquidated: dailyTotals.reduce((sum, item) => sum + item.longTotal, 0),
    totalShortLiquidated: dailyTotals.reduce((sum, item) => sum + item.shortTotal, 0),
    highCapAssets: dailyTotals.filter(item => item.marketCap === 'high').length,
    lowCapAssets: dailyTotals.filter(item => item.marketCap === 'low').length
  };

  return {
    dailyTotals: dailyTotals.slice(0, 50), // Limitar a 50 ativos principais
    addLiquidationToDaily,
    getTopByCategory,
    stats,
    timeUntilReset,
    lastUpdateTime
  };
};
