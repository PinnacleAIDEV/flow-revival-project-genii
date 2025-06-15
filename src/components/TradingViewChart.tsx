
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
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔥 TradingView: Iniciando componente');
    
    // Limpar widget anterior
    if (widgetRef.current) {
      try {
        widgetRef.current.remove();
      } catch (e) {
        console.log('Widget anterior removido');
      }
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const loadWidget = () => {
      console.log('🔥 TradingView: Carregando widget para', selectedAsset);
      
      if (!containerRef.current) {
        console.error('❌ Container não encontrado');
        return;
      }

      if (!window.TradingView) {
        console.error('❌ TradingView não carregado');
        return;
      }

      try {
        widgetRef.current = new window.TradingView.widget({
          width: "100%",
          height: "100%",
          symbol: `BINANCE:${selectedAsset}`,
          interval: "3",
          timezone: "America/Sao_Paulo",
          theme: "light",
          style: "1",
          locale: "pt_BR",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: containerRef.current,
          autosize: true,
          studies: ["VWAP@tv-basicstudies"],
          hide_side_toolbar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          calendar: false,
          popup_width: "1000",
          popup_height: "650"
        });
        
        console.log('✅ TradingView widget criado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao criar TradingView widget:', error);
      }
    };

    // Verificar se o script já está carregado
    if (window.TradingView && window.TradingView.widget) {
      console.log('✅ TradingView já carregado, criando widget');
      loadWidget();
    } else {
      console.log('⏳ Carregando script TradingView...');
      
      // Remover script anterior se existir
      const existingScript = document.querySelector('script[src*="tradingview.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Script TradingView carregado');
        setTimeout(loadWidget, 100); // Pequeno delay para garantir que tudo carregou
      };
      
      script.onerror = (error) => {
        console.error('❌ Erro ao carregar script TradingView:', error);
      };
      
      document.head.appendChild(script);
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.log('Cleanup widget');
        }
      }
    };
  }, [selectedAsset]);

  return (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <div 
        ref={containerRef}
        className="w-full h-full min-h-[400px]"
        style={{ minHeight: '400px' }}
      />
      {!containerRef.current && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Carregando TradingView...</div>
        </div>
      )}
    </div>
  );
};
