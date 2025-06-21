
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type LiquidationInsert = Database['public']['Tables']['liquidations']['Insert'];

export const useOptimizedSupabaseStorage = () => {
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());

  // CORRIGIDO: Critérios muito menos restritivos para salvar dados
  const shouldSaveLiquidation = (liquidationData: Omit<LiquidationInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>) => {
    // Critérios BEM MENOS restritivos para salvar no banco
    const isHighValue = liquidationData.market_cap === 'high' ? 
      liquidationData.amount > 50000 : // High cap: > $50k (era $500k)
      liquidationData.amount > 10000;  // Low cap: > $10k (era $100k)
    
    const isHighVolatility = Math.abs(liquidationData.change_24h) > 1; // > 1% mudança (era 5%)
    
    const isSignificantVolume = liquidationData.volume > 100000; // > 100k volume (era 1M)
    
    // Salva se atender pelo menos 1 dos 3 critérios (era 2)
    const criteriaCount = [isHighValue, isHighVolatility, isSignificantVolume].filter(Boolean).length;
    
    return criteriaCount >= 1;
  };

  // OTIMIZAÇÃO 2: Salvar mais dados (redução de apenas 80% ao invés de 95%+)
  const saveCriticalLiquidation = useCallback(async (liquidationData: Omit<LiquidationInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>) => {
    try {
      // Verificar se deve salvar (agora muito mais permissivo)
      if (!shouldSaveLiquidation(liquidationData)) {
        console.log(`🚫 Liquidação ${liquidationData.asset} NÃO salva (critérios não atendidos)`);
        return null;
      }

      const { data, error } = await supabase
        .from('liquidations')
        .insert(liquidationData)
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar liquidação crítica:', error);
        return null;
      }
      
      console.log(`💾 LIQUIDAÇÃO salva: ${liquidationData.asset} - $${(liquidationData.amount/1000).toFixed(0)}K`);
      setLastSaveTime(new Date());
      
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar liquidação crítica:', error);
      return null;
    }
  }, []);

  // OTIMIZAÇÃO 3: Batch operations mais permissivas
  const saveBatchLiquidations = useCallback(async (liquidations: Array<Omit<LiquidationInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>>) => {
    try {
      // Filtrar liquidações que atendem aos critérios (agora mais permissivos)
      const criticalLiquidations = liquidations.filter(shouldSaveLiquidation);
      
      if (criticalLiquidations.length === 0) {
        console.log('🚫 Nenhuma liquidação atende aos critérios para salvar no banco');
        return [];
      }

      const { data, error } = await supabase
        .from('liquidations')
        .insert(criticalLiquidations)
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar batch de liquidações:', error);
        return [];
      }
      
      console.log(`💾 BATCH CORRIGIDO: ${criticalLiquidations.length} liquidações salvas de ${liquidations.length} total`);
      setLastSaveTime(new Date());
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado no batch save:', error);
      return [];
    }
  }, []);

  // OTIMIZAÇÃO 4: Stats atualizados
  const getStorageStats = useCallback(() => {
    return {
      lastSaveTime,
      criteriaSummary: {
        highCapMinAmount: 50000, // Reduzido de 500k
        lowCapMinAmount: 10000,  // Reduzido de 100k
        minVolatility: 1,        // Reduzido de 5
        minVolume: 100000,       // Reduzido de 1M
        criteriaRequired: 1      // Reduzido de 2
      }
    };
  }, [lastSaveTime]);

  // OTIMIZAÇÃO 5: Limpeza menos agressiva
  const cleanupCriticalDataOnly = useCallback(async () => {
    try {
      // Apenas limpar dados muito antigos (mais de 12h ao invés de 24h)
      const { error } = await supabase
        .from('liquidations')
        .delete()
        .lt('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());
      
      if (error) {
        console.error('❌ Erro na limpeza crítica:', error);
        return false;
      }
      
      console.log('🧹 Limpeza crítica executada (dados > 12h removidos)');
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado na limpeza crítica:', error);
      return false;
    }
  }, []);

  return {
    saveCriticalLiquidation,
    saveBatchLiquidations,
    cleanupCriticalDataOnly,
    getStorageStats,
    shouldSaveLiquidation
  };
};
