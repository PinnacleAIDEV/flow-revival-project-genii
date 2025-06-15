
import React, { useEffect, useRef } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Aqui integraria o TradingView widget real
    // Por enquanto, deixaremos como placeholder estilizado
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          width: '100%',
          height: '100%',
          symbol: 'BINANCE:BTCUSDT',
          interval: '1',
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          style: '1',
          locale: 'pt_BR',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="h-full w-full relative">
      <div 
        ref={containerRef}
        id="tradingview_chart"
        className="h-full w-full"
      />
      
      {/* Fallback content */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-blue-300">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="w-12 h-12 text-blue-500" />
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">TradingView Chart</h3>
            <p className="text-gray-600 max-w-md">
              Gráfico profissional TradingView será carregado aqui com análise completa de candlesticks, indicadores técnicos e volume.
            </p>
            <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
              <span>• Timeframes múltiplos</span>
              <span>• Indicadores técnicos</span>
              <span>• Análise de volume</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    TradingView: any;
  }
}
