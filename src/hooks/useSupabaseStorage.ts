
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiquidationData {
  asset: string;
  ticker: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  market_cap: 'high' | 'low';
  intensity: number;
  change_24h: number;
  volume: number;
  total_liquidated: number;
  volume_spike?: number;
  trades_count?: number;
  exchange?: string;
  vwap?: number;
  bid?: number;
  ask?: number;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  close_price?: number;
}

interface CoinTrendData {
  asset: string;
  ticker: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  anomaly_score: number;
  volume_spike: number;
  last_activity_hours: number;
  daily_volume_impact: number;
  change_24h: number;
  volume: number;
  is_hidden: boolean;
  is_micro_cap: boolean;
  volume_24h?: number;
  trades_count?: number;
  exchange?: string;
  vwap?: number;
  bid?: number;
  ask?: number;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  close_price?: number;
}

export const useSupabaseStorage = () => {
  const [isStorageConnected, setIsStorageConnected] = useState(false);

  useEffect(() => {
    // Testar conexão com Supabase
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('liquidations').select('id').limit(1);
        if (error) {
          console.error('❌ Erro ao conectar com Supabase:', error);
          setIsStorageConnected(false);
        } else {
          console.log('✅ Conectado ao banco de dados Supabase');
          setIsStorageConnected(true);
        }
      } catch (error) {
        console.error('❌ Falha na conexão:', error);
        setIsStorageConnected(false);
      }
    };

    testConnection();

    // Configurar limpeza automática a cada 5 minutos
    const cleanupInterval = setInterval(async () => {
      try {
        const { error } = await supabase.rpc('cleanup_expired_data');
        if (error) {
          console.error('❌ Erro na limpeza automática:', error);
        } else {
          console.log('🧹 Limpeza automática executada');
        }
      } catch (error) {
        console.error('❌ Falha na limpeza:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(cleanupInterval);
  }, []);

  const saveLiquidation = useCallback(async (liquidation: LiquidationData) => {
    if (!isStorageConnected) return;

    try {
      const { error } = await supabase
        .from('liquidations')
        .upsert({
          asset: liquidation.asset,
          ticker: liquidation.ticker,
          type: liquidation.type,
          amount: liquidation.amount,
          price: liquidation.price,
          market_cap: liquidation.market_cap,
          intensity: liquidation.intensity,
          change_24h: liquidation.change_24h,
          volume: liquidation.volume,
          total_liquidated: liquidation.total_liquidated,
          volume_spike: liquidation.volume_spike || 1,
          trades_count: liquidation.trades_count || 0,
          exchange: liquidation.exchange || 'Binance',
          vwap: liquidation.vwap,
          bid: liquidation.bid,
          ask: liquidation.ask,
          open_price: liquidation.open_price,
          high_price: liquidation.high_price,
          low_price: liquidation.low_price,
          close_price: liquidation.close_price,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'asset,type'
        });

      if (error) {
        console.error('❌ Erro ao salvar liquidação:', error);
      } else {
        console.log(`💾 Liquidação salva: ${liquidation.asset} - ${liquidation.type.toUpperCase()}`);
        
        // Atualizar estatísticas do ativo
        await updateAssetStatistics(liquidation.asset);
      }
    } catch (error) {
      console.error('❌ Falha ao salvar liquidação:', error);
    }
  }, [isStorageConnected]);

  const saveCoinTrend = useCallback(async (trend: CoinTrendData) => {
    if (!isStorageConnected) return;

    try {
      const { error } = await supabase
        .from('coin_trends')
        .upsert({
          asset: trend.asset,
          ticker: trend.ticker,
          type: trend.type,
          amount: trend.amount,
          price: trend.price,
          anomaly_score: trend.anomaly_score,
          volume_spike: trend.volume_spike,
          last_activity_hours: trend.last_activity_hours,
          daily_volume_impact: trend.daily_volume_impact,
          change_24h: trend.change_24h,
          volume: trend.volume,
          is_hidden: trend.is_hidden,
          is_micro_cap: trend.is_micro_cap,
          volume_24h: trend.volume_24h || 0,
          trades_count: trend.trades_count || 0,
          exchange: trend.exchange || 'Binance',
          vwap: trend.vwap,
          bid: trend.bid,
          ask: trend.ask,
          open_price: trend.open_price,
          high_price: trend.high_price,
          low_price: trend.low_price,
          close_price: trend.close_price,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'asset'
        });

      if (error) {
        console.error('❌ Erro ao salvar trend:', error);
      } else {
        console.log(`💾 Trend salvo: ${trend.asset} - Score: ${trend.anomaly_score}/10`);
        
        // Atualizar estatísticas do ativo
        await updateAssetStatistics(trend.asset);
      }
    } catch (error) {
      console.error('❌ Falha ao salvar trend:', error);
    }
  }, [isStorageConnected]);

  const updateAssetStatistics = useCallback(async (asset: string) => {
    if (!isStorageConnected) return;

    try {
      const { error } = await supabase.rpc('update_asset_statistics', {
        asset_name: asset
      });

      if (error) {
        console.error('❌ Erro ao atualizar estatísticas:', error);
      } else {
        console.log(`📊 Estatísticas atualizadas: ${asset}`);
      }
    } catch (error) {
      console.error('❌ Falha ao atualizar estatísticas:', error);
    }
  }, [isStorageConnected]);

  const getLiquidations = useCallback(async (limit: number = 50) => {
    if (!isStorageConnected) return [];

    try {
      const { data, error } = await supabase
        .from('liquidations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erro ao buscar liquidações:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Falha ao buscar liquidações:', error);
      return [];
    }
  }, [isStorageConnected]);

  const getCoinTrends = useCallback(async (limit: number = 30) => {
    if (!isStorageConnected) return [];

    try {
      const { data, error } = await supabase
        .from('coin_trends')
        .select('*')
        .order('anomaly_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erro ao buscar trends:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Falha ao buscar trends:', error);
      return [];
    }
  }, [isStorageConnected]);

  const getAssetStatistics = useCallback(async () => {
    if (!isStorageConnected) return [];

    try {
      const { data, error } = await supabase
        .from('asset_statistics')
        .select('*')
        .order('total_long_liquidations', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Falha ao buscar estatísticas:', error);
      return [];
    }
  }, [isStorageConnected]);

  const searchAssets = useCallback(async (searchTerm: string) => {
    if (!isStorageConnected || !searchTerm) return [];

    try {
      const { data, error } = await supabase
        .from('asset_statistics')
        .select('*')
        .ilike('asset', `%${searchTerm}%`)
        .order('last_activity', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Erro na busca:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Falha na busca:', error);
      return [];
    }
  }, [isStorageConnected]);

  return {
    isStorageConnected,
    saveLiquidation,
    saveCoinTrend,
    updateAssetStatistics,
    getLiquidations,
    getCoinTrends,
    getAssetStatistics,
    searchAssets
  };
};
