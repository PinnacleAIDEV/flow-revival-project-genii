
import React, { useEffect, useRef } from 'react';
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
    // Limpar container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Função para criar o widget
    const createWidget = () => {
      if (containerRef.current && window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${selectedAsset}`,
          interval: '3',
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          style: '1',
          locale: 'pt_BR',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: containerRef.current.id,
          studies: ['VWAP@tv-basicstudies']
        });
      }
    };

    // Carregar script se não existir
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    } else {
      createWidget();
    }
  }, [selectedAsset]);

  return (
    <div className="w-full h-full">
      <div 
        ref={containerRef} 
        id={`tradingview_${Date.now()}`}
        className="w-full h-full"
      />
    </div>
  );
};
