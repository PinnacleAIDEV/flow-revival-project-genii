
import React, { useEffect, useRef } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": "BINANCE:BTCUSDT",
      "interval": "1",
      "timezone": "America/Sao_Paulo",
      "theme": "light",
      "style": "1",
      "locale": "pt",
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "container_id": "tradingview_widget"
    });

    const container = containerRef.current;
    if (container && !container.querySelector('script')) {
      container.appendChild(script);
    }

    return () => {
      if (container && container.querySelector('script')) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="h-full w-full relative">
      <div 
        ref={containerRef}
        id="tradingview_widget"
        className="h-full w-full"
      >
        <div className="tradingview-widget-container h-full">
          <div className="tradingview-widget-container__widget h-full"></div>
        </div>
      </div>
      
      {/* Fallback content - só aparece se o TradingView não carregar */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-blue-300 opacity-0 pointer-events-none">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="w-12 h-12 text-blue-500" />
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">TradingView Chart</h3>
            <p className="text-gray-600 max-w-md">
              Carregando gráfico profissional TradingView...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
