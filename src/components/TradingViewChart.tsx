
import React, { useEffect, useRef } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedAsset } = useTrading();

  useEffect(() => {
    // Limpar container anterior
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Carregar script do TradingView se não existir
    if (!document.querySelector('script[src*="tradingview.com"]')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Aguardar um pouco para o script carregar e então criar o widget
    const timer = setTimeout(() => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${selectedAsset}`,
          interval: '3',
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          style: '1',
          locale: 'pt_BR',
          enable_publishing: false,
          allow_symbol_change: true,
          calendar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id,
          width: '100%',
          height: '100%',
          studies: ['VWAP@tv-basicstudies']
        });
        console.log(`✅ TradingView widget carregado para ${selectedAsset}`);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [selectedAsset]);

  return (
    <div className="h-full w-full relative bg-white">
      <div 
        ref={containerRef}
        id={`tradingview_${Date.now()}`}
        className="h-full w-full"
      />
      
      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="w-12 h-12 text-blue-500 animate-pulse" />
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              TradingView Chart - {selectedAsset}
            </h3>
            <p className="text-gray-600 text-sm">
              Carregando gráfico de 3min com VWAP...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
