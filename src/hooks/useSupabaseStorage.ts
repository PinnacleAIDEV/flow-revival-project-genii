
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type LiquidationInsert = Database['public']['Tables']['liquidations']['Insert'];
type CoinTrendInsert = Database['public']['Tables']['coin_trends']['Insert'];

export const useSupabaseStorage = () => {
  // Salvar liquidação no banco
  const saveLiquidation = useCallback(async (liquidationData: Omit<LiquidationInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>) => {
    try {
      const { data, error } = await supabase
        .from('liquidations')
        .insert(liquidationData)
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar liquidação:', error);
        return null;
      }
      
      console.log('💾 Liquidação salva no Supabase:', liquidationData.asset);
      
      // Atualizar estatísticas do ativo
      await supabase.rpc('update_asset_statistics', { asset_name: liquidationData.asset });
      
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar liquidação:', error);
      return null;
    }
  }, []);

  // Salvar dados do CoinTrendHunter
  const saveCoinTrend = useCallback(async (trendData: Omit<CoinTrendInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>) => {
    try {
      const { data, error } = await supabase
        .from('coin_trends')
        .insert(trendData)
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar trend:', error);
        return null;
      }
      
      console.log('💾 Trend salvo no Supabase:', trendData.asset);
      
      // Atualizar estatísticas do ativo
      await supabase.rpc('update_asset_statistics', { asset_name: trendData.asset });
      
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar trend:', error);
      return null;
    }
  }, []);

  // Buscar liquidações por ativo
  const getLiquidationsByAsset = useCallback(async (asset: string) => {
    try {
      const { data, error } = await supabase
        .from('liquidations')
        .select('*')
        .eq('asset', asset)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar liquidações:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar liquidações:', error);
      return [];
    }
  }, []);

  // Buscar trends por ativo
  const getTrendsByAsset = useCallback(async (asset: string) => {
    try {
      const { data, error } = await supabase
        .from('coin_trends')
        .select('*')
        .eq('asset', asset)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar trends:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar trends:', error);
      return [];
    }
  }, []);

  // Buscar estatísticas de um ativo
  const getAssetStatistics = useCallback(async (asset: string) => {
    try {
      const { data, error } = await supabase
        .from('asset_statistics')
        .select('*')
        .eq('asset', asset)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Erro ao buscar estatísticas:', error);
        return null;
      }
      
      return data || null;
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar estatísticas:', error);
      return null;
    }
  }, []);

  // Buscar todos os ativos com atividade recente
  const getAllActiveAssets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('asset_statistics')
        .select('*')
        .eq('is_trending', true)
        .order('last_activity', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('❌ Erro ao buscar ativos ativos:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar ativos ativos:', error);
      return [];
    }
  }, []);

  return {
    saveLiquidation,
    saveCoinTrend,
    getLiquidationsByAsset,
    getTrendsByAsset,
    getAssetStatistics,
    getAllActiveAssets
  };
};
