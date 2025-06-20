
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Activity, 
  Database, 
  Eye, 
  LayoutDashboard, 
  Star,
  Brain,
  Search,
  Users,
  Settings,
  CreditCard,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();
  const [isNavHovered, setIsNavHovered] = useState(false);

  const tools = [
    {
      title: "LIQUIDATION_TRACKER",
      description: "&gt;&gt; MONITORA LIQUIDAÇÕES EM TEMPO REAL COM BUBBLE MAP INTERATIVO",
      icon: TrendingUp,
      route: "/liquidations",
      status: "ACTIVE"
    },
    {
      title: "UNUSUAL_VOLUME_MONITOR", 
      description: "&gt;&gt; DETECTA SPIKES DE VOLUME 3X+ COM ANÁLISE DE CANDLES 1MIN",
      icon: Eye,
      route: "/unusual-volume",
      status: "ACTIVE"
    },
    {
      title: "ARKHAM_INTELLIGENCE",
      description: "&gt;&gt; ANALYTICS ON-CHAIN E WHALE TRACKING COM DADOS ARKHAM",
      icon: Activity,
      route: "/arkham",
      status: "BETA"
    },
    {
      title: "ASSET_DATABASE",
      description: "&gt;&gt; BASE DE DADOS COMPLETA COM MÉTRICAS AVANÇADAS CRYPTO",
      icon: Database,
      route: "/database",
      status: "ACTIVE"
    },
    {
      title: "AI_ANALYTICS_SUITE", 
      description: "&gt;&gt; INTELIGÊNCIA ARTIFICIAL PARA ANÁLISE DE MERCADO AVANÇADA",
      icon: Brain,
      route: "/ai-analytics",
      status: "NEW"
    },
    {
      title: "DASHBOARD",
      description: "&gt;&gt; PAINEL DE CONTROLE E DADOS CADASTRAIS DO USUÁRIO",
      icon: LayoutDashboard,
      route: "/dashboard",
      status: "ACTIVE"
    },
    {
      title: "AIPINNACLE_PRO",
      description: "&gt;&gt; O ÚNICO INDICADOR QUE DELETA SINAIS FALSOS",
      icon: Star,
      route: "/aipinnacle",
      status: "LAUNCH"
    }
  ];

  const aiFeatures = [
    {
      title: "DIRECTION_ANALYZER",
      description: "Análise de direção com precisão neural avançada",
      prompt: "Analisa padrões de mercado para prever direção de movimento com IA"
    },
    {
      title: "NEWS_ANALYZER", 
      description: "Processamento de notícias com NLP em tempo real",
      prompt: "Processa notícias do mercado crypto usando processamento de linguagem natural"
    },
    {
      title: "MARKET_PERCEPTION",
      description: "Análise de sentimento do mercado com deep learning", 
      prompt: "Avalia sentimento geral do mercado usando algoritmos de deep learning"
    },
    {
      title: "MARKET_OPENING_TRACKER",
      description: "Tracking de abertura de mercados globais",
      prompt: "Monitora abertura de mercados globais e impacto no crypto"
    }
  ];

  return (
    <div className="min-h-screen bg-black grid-overlay">
      {/* Vertical Header */}
      <div 
        className={`fixed left-0 top-0 h-full bg-black border-r-2 border-neon z-50 flex flex-col items-center py-4 scanlines transition-all duration-300 ${
          isNavHovered ? 'w-20' : 'w-16'
        }`}
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
      >
        <div className="w-12 h-12 border-2 border-electric bg-electric mb-6 flex items-center justify-center">
          <img src="/lovable-uploads/e928a4ae-7be9-44ed-82b2-a5faaf98584e.png" alt="Logo" className="w-8 h-8" />
        </div>
        
        <nav className="flex flex-col space-y-3 flex-1">
          <button
            onClick={() => navigate('/tools')}
            className="w-12 h-12 border-2 border-neon bg-black text-neon hover:bg-neon hover:text-black transition-colors flex items-center justify-center"
            title="TOOLS"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate('/auth')}
            className="w-12 h-12 border-2 border-electric bg-black text-electric hover:bg-electric hover:text-black transition-colors flex items-center justify-center"
            title="LOGIN/CADASTRO"
          >
            <LogIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate('/pricing')}
            className="w-12 h-12 border-2 border-glitch-red bg-black text-glitch-red hover:bg-glitch-red hover:text-black transition-colors flex items-center justify-center"
            title="PRICING"
          >
            <CreditCard className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate('/aipinnacle')}
            className="w-12 h-12 border-2 border-neon bg-neon text-black hover:bg-electric hover:border-electric transition-colors flex items-center justify-center glitch"
            title="AI PINNACLE"
            data-text="★"
          >
            <Star className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* Tools Sidebar - Hidden by default, shows on hover */}
      <div 
        className={`fixed top-0 h-full bg-black border-r-2 border-electric z-40 scanlines overflow-y-auto transition-all duration-300 ${
          isNavHovered ? 'left-20 w-64 opacity-100' : 'left-16 w-0 opacity-0'
        }`}
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
      >
        <div className="p-4 border-b-2 border-electric">
          <h2 className="font-display text-electric text-sm">FERRAMENTAS_SISTEMA</h2>
        </div>
        <div className="p-2">
          {tools.map((tool, index) => (
            <button
              key={index}
              onClick={() => navigate(tool.route)}
              className="w-full p-3 mb-2 border-2 border-neon bg-black text-left hover:bg-neon hover:text-black transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <tool.icon className="w-4 h-4 text-electric group-hover:text-black" />
                <span className={`text-xs font-mono-bold px-1 ${
                  tool.status === 'NEW' ? 'bg-neon text-black' : 
                  tool.status === 'LAUNCH' ? 'bg-electric text-black' :
                  tool.status === 'BETA' ? 'bg-glitch-red text-black' :
                  'bg-neon text-black'
                }`}>
                  [{tool.status}]
                </span>
              </div>
              <div className="text-xs font-mono text-neon group-hover:text-black">
                {tool.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Dynamic margin based on hover state */}
      <div className={`min-h-screen transition-all duration-300 ${isNavHovered ? 'ml-84' : 'ml-16'}`}>
        <div className="container mx-auto px-6 py-8">
          {/* ASCII Header */}
          <div className="text-center mb-12">
            <div className="ascii-divider"></div>
            <pre className="text-neon text-xs mb-4 font-mono leading-none">
{`
██████╗ ██╗███╗   ██╗███╗   ██╗ █████╗  ██████╗██╗     ███████╗    ███╗   ███╗ █████╗ ██████╗ ██╗  ██╗███████╗████████╗    ██╗███╗   ██╗████████╗███████╗██╗     
██╔══██╗██║████╗  ██║████╗  ██║██╔══██╗██╔════╝██║     ██╔════╝    ████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝╚══██╔══╝    ██║████╗  ██║╚══██╔══╝██╔════╝██║     
██████╔╝██║██╔██╗ ██║██╔██╗ ██║███████║██║     ██║     █████╗      ██╔████╔██║███████║██████╔╝█████╔╝ █████╗     ██║       ██║██╔██╗ ██║   ██║   █████╗  ██║     
██╔═══╝ ██║██║╚██╗██║██║╚██╗██║██╔══██║██║     ██║     ██╔══╝      ██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ██╔══╝     ██║       ██║██║╚██╗██║   ██║   ██╔══╝  ██║     
██║     ██║██║ ╚████║██║ ╚████║██║  ██║╚██████╗███████╗███████╗    ██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗███████╗   ██║       ██║██║ ╚████║   ██║   ███████╗███████╗
╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝
`}
            </pre>
            <div className="ascii-divider"></div>
            
            <div className="terminal p-6 mb-8 scanlines">
              <p className="text-electric font-mono-bold text-lg mb-4">
                &gt;&gt; PLATAFORMA COMPLETA DE INTELIGÊNCIA CRYPTO
              </p>
              <p className="text-neon font-mono text-sm leading-relaxed">
                ANÁLISE EM TEMPO REAL // TRACKING DE LIQUIDAÇÕES // INTELIGÊNCIA ARTIFICIAL
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="brutal-btn px-8 py-4 text-lg font-display glitch"
                data-text="&gt;&gt; DASHBOARD"
              >
                &gt;&gt; DASHBOARD
              </button>
              <button
                onClick={() => navigate('/aipinnacle')}
                className="brutal-btn px-8 py-4 text-lg font-display glitch bg-electric text-black border-electric hover:bg-neon hover:border-neon"
                data-text="★ AI PINNACLE PRO"
              >
                ★ AI PINNACLE PRO
              </button>
            </div>
          </div>

          {/* AI/ML Section */}
          <div className="mb-16">
            <div className="ascii-divider mb-6"></div>
            <div className="brutal-card p-8 scanlines">
              <div className="text-center mb-8">
                <div className="w-16 h-16 border-2 border-neon bg-neon mx-auto mb-4 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-black" />
                </div>
                <h2 className="font-display text-neon text-3xl mb-4 glitch" data-text="AI_INTELLIGENCE_SUITE">
                  AI_INTELLIGENCE_SUITE
                </h2>
                <p className="text-electric font-mono text-lg mb-6">
                  &gt;&gt; INTELIGÊNCIA ARTIFICIAL PARA ANÁLISE DE MERCADO AVANÇADA
                </p>
                <button
                  onClick={() => navigate('/ai-analytics')}
                  className="brutal-btn px-6 py-3 font-display"
                >
                  ACESSAR_AI_SUITE →
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiFeatures.map((feature, index) => (
                  <div key={index} className="border-2 border-electric p-4 bg-black">
                    <h3 className="font-display text-electric text-sm mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-neon font-mono text-xs mb-3">
                      {feature.description}
                    </p>
                    <div className="border-t-2 border-neon pt-2">
                      <p className="text-electric font-mono text-xs">
                        PROMPT: {feature.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {tools.slice(0, 6).map((tool, index) => {
              const Icon = tool.icon;
              return (
                <div
                  key={index}
                  className="brutal-card p-6 cursor-pointer group scanlines"
                  onClick={() => navigate(tool.route)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 border-2 border-electric bg-electric flex items-center justify-center group-hover:bg-neon group-hover:border-neon transition-colors">
                      <Icon className="w-6 h-6 text-black" />
                    </div>
                    {tool.status && (
                      <div className={`px-2 py-1 text-xs font-mono-bold border-2 ${
                        tool.status === 'NEW' ? 'border-neon bg-neon text-black' : 
                        tool.status === 'LAUNCH' ? 'border-electric bg-electric text-black' :
                        tool.status === 'BETA' ? 'border-glitch-red bg-glitch-red text-black' :
                        'border-neon bg-neon text-black'
                      }`}>
                        [{tool.status}]
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-display text-neon text-lg mb-3 group-hover:text-electric transition-colors glitch" data-text={tool.title}>
                    {tool.title}
                  </h3>
                  
                  <p className="text-electric font-mono text-sm leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: tool.description }}>
                  </p>
                  
                  <div className="border-t-2 border-neon pt-4">
                    <span className="text-neon font-mono-bold text-xs group-hover:text-electric transition-colors">
                      [PRESS_TO_ACCESS] →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ASCII Footer */}
          <div className="text-center border-t-2 border-neon pt-8">
            <div className="ascii-divider"></div>
            <p className="text-electric font-mono text-sm">
              © 2024 PINNACLE_MARKET_INTEL // PLATAFORMA DE ANÁLISE CRYPTO EM TEMPO REAL
            </p>
            <div className="ascii-divider"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
