-- Criar tabela otimizada para unusual volume alerts multi-timeframe
CREATE TABLE public.unusual_volume_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  asset TEXT NOT NULL,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('1m', '3m', '15m')),
  market_type TEXT NOT NULL CHECK (market_type IN ('spot', 'futures')),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('buy', 'sell', 'long', 'short')),
  volume_baseline DECIMAL NOT NULL DEFAULT 0,
  volume_current DECIMAL NOT NULL DEFAULT 0,
  volume_multiplier DECIMAL NOT NULL DEFAULT 1,
  price_movement DECIMAL NOT NULL DEFAULT 0,
  price DECIMAL NOT NULL DEFAULT 0,
  strength INTEGER NOT NULL DEFAULT 1 CHECK (strength >= 1 AND strength <= 5),
  session_region TEXT DEFAULT 'unknown',
  trades_count INTEGER DEFAULT 0,
  created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Índices otimizados para queries rápidas
CREATE INDEX idx_unusual_volume_market_timeframe ON public.unusual_volume_alerts(market_type, timeframe);
CREATE INDEX idx_unusual_volume_strength ON public.unusual_volume_alerts(strength DESC, volume_multiplier DESC);
CREATE INDEX idx_unusual_volume_expires ON public.unusual_volume_alerts(expires_at);
CREATE INDEX idx_unusual_volume_ticker ON public.unusual_volume_alerts(ticker, timeframe);

-- Enable RLS
ALTER TABLE public.unusual_volume_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para acesso público (read-only para dados de mercado)
CREATE POLICY "Allow public read access to unusual_volume_alerts" 
ON public.unusual_volume_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert unusual_volume_alerts" 
ON public.unusual_volume_alerts 
FOR INSERT 
WITH CHECK (true);

-- Função para cleanup automático diário (23:48 UTC)
CREATE OR REPLACE FUNCTION public.cleanup_unusual_volume_alerts()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
  cleanup_time TIMESTAMP WITH TIME ZONE;
BEGIN
  cleanup_time := now();
  
  -- Limpar alertas expirados
  DELETE FROM public.unusual_volume_alerts 
  WHERE expires_at < cleanup_time;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  RAISE NOTICE 'Unusual volume cleanup completed at %: Deleted % records', 
    cleanup_time, deleted_count;
    
  -- Analyze table after cleanup
  ANALYZE public.unusual_volume_alerts;
END;
$$;

-- Função para salvar alertas de volume
CREATE OR REPLACE FUNCTION public.save_unusual_volume_alert(
  p_ticker TEXT,
  p_asset TEXT,
  p_timeframe TEXT,
  p_market_type TEXT,
  p_alert_type TEXT,
  p_volume_baseline DECIMAL,
  p_volume_current DECIMAL,
  p_volume_multiplier DECIMAL,
  p_price_movement DECIMAL,
  p_price DECIMAL,
  p_strength INTEGER,
  p_session_region TEXT DEFAULT 'unknown',
  p_trades_count INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO public.unusual_volume_alerts (
    ticker, asset, timeframe, market_type, alert_type,
    volume_baseline, volume_current, volume_multiplier,
    price_movement, price, strength, session_region, trades_count
  ) VALUES (
    p_ticker, p_asset, p_timeframe, p_market_type, p_alert_type,
    p_volume_baseline, p_volume_current, p_volume_multiplier,
    p_price_movement, p_price, p_strength, p_session_region, p_trades_count
  )
  RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$;