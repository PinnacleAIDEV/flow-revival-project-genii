
-- Tabela para armazenar liquidações (long/short)
CREATE TABLE public.liquidations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,
  ticker TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('long', 'short')),
  amount DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  market_cap TEXT NOT NULL CHECK (market_cap IN ('high', 'low')),
  intensity INTEGER NOT NULL DEFAULT 1,
  change_24h DECIMAL NOT NULL DEFAULT 0,
  volume DECIMAL NOT NULL DEFAULT 0,
  total_liquidated DECIMAL NOT NULL DEFAULT 0,
  volume_spike DECIMAL DEFAULT 1,
  trades_count INTEGER DEFAULT 0,
  exchange TEXT DEFAULT 'Binance',
  vwap DECIMAL,
  bid DECIMAL,
  ask DECIMAL,
  open_price DECIMAL,
  high_price DECIMAL,
  low_price DECIMAL,
  close_price DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '4 hours')
);

-- Tabela para armazenar dados do CoinTrendHunter (micro-caps e ativos incomuns)
CREATE TABLE public.coin_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,
  ticker TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('long', 'short')),
  amount DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  anomaly_score INTEGER NOT NULL DEFAULT 1 CHECK (anomaly_score >= 1 AND anomaly_score <= 10),
  volume_spike DECIMAL NOT NULL DEFAULT 1,
  last_activity_hours DECIMAL NOT NULL DEFAULT 0,
  daily_volume_impact DECIMAL NOT NULL DEFAULT 0,
  change_24h DECIMAL NOT NULL DEFAULT 0,
  volume DECIMAL NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_micro_cap BOOLEAN NOT NULL DEFAULT false,
  volume_24h DECIMAL DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  exchange TEXT DEFAULT 'Binance',
  vwap DECIMAL,
  bid DECIMAL,
  ask DECIMAL,
  open_price DECIMAL,
  high_price DECIMAL,
  low_price DECIMAL,
  close_price DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '4 hours')
);

-- Tabela para armazenar estatísticas agregadas por ativo
CREATE TABLE public.asset_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL UNIQUE,
  ticker TEXT NOT NULL,
  total_long_liquidations DECIMAL NOT NULL DEFAULT 0,
  total_short_liquidations DECIMAL NOT NULL DEFAULT 0,
  total_volume_24h DECIMAL NOT NULL DEFAULT 0,
  avg_price DECIMAL NOT NULL DEFAULT 0,
  current_price DECIMAL NOT NULL DEFAULT 0,
  price_change_24h DECIMAL NOT NULL DEFAULT 0,
  max_liquidation_amount DECIMAL NOT NULL DEFAULT 0,
  liquidation_count INTEGER NOT NULL DEFAULT 0,
  anomaly_events_count INTEGER NOT NULL DEFAULT 0,
  avg_anomaly_score DECIMAL NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  market_cap_category TEXT CHECK (market_cap_category IN ('high', 'low')),
  is_trending BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhorar performance das consultas
CREATE INDEX idx_liquidations_asset ON public.liquidations(asset);
CREATE INDEX idx_liquidations_type ON public.liquidations(type);
CREATE INDEX idx_liquidations_created_at ON public.liquidations(created_at);
CREATE INDEX idx_liquidations_expires_at ON public.liquidations(expires_at);
CREATE INDEX idx_liquidations_amount ON public.liquidations(amount DESC);

CREATE INDEX idx_coin_trends_asset ON public.coin_trends(asset);
CREATE INDEX idx_coin_trends_anomaly_score ON public.coin_trends(anomaly_score DESC);
CREATE INDEX idx_coin_trends_created_at ON public.coin_trends(created_at);
CREATE INDEX idx_coin_trends_expires_at ON public.coin_trends(expires_at);
CREATE INDEX idx_coin_trends_is_micro_cap ON public.coin_trends(is_micro_cap);

CREATE INDEX idx_asset_statistics_asset ON public.asset_statistics(asset);
CREATE INDEX idx_asset_statistics_is_trending ON public.asset_statistics(is_trending);
CREATE INDEX idx_asset_statistics_updated_at ON public.asset_statistics(updated_at);

-- Função para limpar registros expirados automaticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpar liquidações expiradas (mais de 4 horas)
  DELETE FROM public.liquidations 
  WHERE expires_at < now();
  
  -- Limpar dados de trends expirados (mais de 4 horas)
  DELETE FROM public.coin_trends 
  WHERE expires_at < now();
  
  -- Atualizar estatísticas dos ativos (remover ativos sem atividade recente)
  DELETE FROM public.asset_statistics 
  WHERE last_activity < (now() - interval '4 hours');
  
  RAISE NOTICE 'Cleanup completed at %', now();
END;
$$;

-- Função para atualizar estatísticas de um ativo
CREATE OR REPLACE FUNCTION public.update_asset_statistics(asset_name TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  ticker_name TEXT;
  long_total DECIMAL;
  short_total DECIMAL;
  vol_24h DECIMAL;
  avg_price_val DECIMAL;
  current_price_val DECIMAL;
  price_change DECIMAL;
  max_liq DECIMAL;
  liq_count INTEGER;
  anomaly_count INTEGER;
  avg_anomaly DECIMAL;
  market_cap_cat TEXT;
BEGIN
  -- Buscar dados do ticker
  SELECT ticker INTO ticker_name 
  FROM public.liquidations 
  WHERE asset = asset_name 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Calcular estatísticas de liquidações
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'long' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'short' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(volume), 0),
    COALESCE(AVG(price), 0),
    COALESCE(MAX(price), 0),
    COALESCE(AVG(change_24h), 0),
    COALESCE(MAX(amount), 0),
    COUNT(*),
    COALESCE(MAX(market_cap), 'low')
  INTO long_total, short_total, vol_24h, avg_price_val, current_price_val, 
       price_change, max_liq, liq_count, market_cap_cat
  FROM public.liquidations 
  WHERE asset = asset_name AND expires_at > now();
  
  -- Calcular estatísticas de anomalias
  SELECT 
    COUNT(*),
    COALESCE(AVG(anomaly_score), 0)
  INTO anomaly_count, avg_anomaly
  FROM public.coin_trends 
  WHERE asset = asset_name AND expires_at > now();
  
  -- Inserir ou atualizar estatísticas
  INSERT INTO public.asset_statistics (
    asset, ticker, total_long_liquidations, total_short_liquidations,
    total_volume_24h, avg_price, current_price, price_change_24h,
    max_liquidation_amount, liquidation_count, anomaly_events_count,
    avg_anomaly_score, last_activity, market_cap_category, is_trending
  ) VALUES (
    asset_name, COALESCE(ticker_name, asset_name || 'USDT'), 
    long_total, short_total, vol_24h, avg_price_val, current_price_val,
    price_change, max_liq, liq_count, anomaly_count, avg_anomaly,
    now(), market_cap_cat, (liq_count > 0 OR anomaly_count > 0)
  )
  ON CONFLICT (asset) DO UPDATE SET
    ticker = EXCLUDED.ticker,
    total_long_liquidations = EXCLUDED.total_long_liquidations,
    total_short_liquidations = EXCLUDED.total_short_liquidations,
    total_volume_24h = EXCLUDED.total_volume_24h,
    avg_price = EXCLUDED.avg_price,
    current_price = EXCLUDED.current_price,
    price_change_24h = EXCLUDED.price_change_24h,
    max_liquidation_amount = EXCLUDED.max_liquidation_amount,
    liquidation_count = EXCLUDED.liquidation_count,
    anomaly_events_count = EXCLUDED.anomaly_events_count,
    avg_anomaly_score = EXCLUDED.avg_anomaly_score,
    last_activity = EXCLUDED.last_activity,
    market_cap_category = EXCLUDED.market_cap_category,
    is_trending = EXCLUDED.is_trending,
    updated_at = now();
END;
$$;

-- Habilitar Row Level Security (RLS) - dados públicos para leitura
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_statistics ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir leitura pública (dados de mercado são públicos)
CREATE POLICY "Allow public read access to liquidations" 
  ON public.liquidations FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to coin_trends" 
  ON public.coin_trends FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to asset_statistics" 
  ON public.asset_statistics FOR SELECT 
  USING (true);

-- Políticas para permitir inserção/atualização via aplicação
CREATE POLICY "Allow insert liquidations" 
  ON public.liquidations FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow insert coin_trends" 
  ON public.coin_trends FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow insert asset_statistics" 
  ON public.asset_statistics FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update asset_statistics" 
  ON public.asset_statistics FOR UPDATE 
  USING (true);
