import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, Database, Eye, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Dashboard Central",
      description: "Acesse todas as ferramentas de análise crypto em um só lugar",
      icon: LayoutDashboard,
      route: "/dashboard",
      gradient: "from-[#00E0FF] to-[#A6FF00]",
      status: "NEW"
    },
    {
      title: "Liquidation Tracker",
      description: "Monitore liquidações em tempo real com visualização interativa",
      icon: TrendingUp,
      route: "/liquidations",
      gradient: "from-[#FF4D4D] to-[#FF8C00]"
    },
    {
      title: "Unusual Volume Monitor",
      description: "Detecte spikes de volume anormais com análise de candles 1min",
      icon: Eye,
      route: "/unusual-volume",
      gradient: "from-[#A6FF00] to-[#00E0FF]"
    },
    {
      title: "Arkham Intelligence",
      description: "Analytics on-chain e whale tracking com dados da Arkham",
      icon: Activity,
      route: "/arkham",
      gradient: "from-[#FF8C00] to-[#FF4D4D]",
      status: "BETA"
    },
    {
      title: "Asset Database",
      description: "Base de dados completa com métricas avançadas de criptomoedas",
      icon: Database,
      route: "/database",
      gradient: "from-[#8B5CF6] to-[#EC4899]"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1E] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#00E0FF] to-[#A6FF00] rounded-xl flex items-center justify-center relative">
              <Activity className="w-7 h-7 text-black" />
              <div className="absolute inset-0 bg-[#00E0FF]/20 rounded-xl animate-pulse"></div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[#F5F5F5] font-mono">
              CRYPTO INTEL
            </h1>
          </div>
          <p className="text-xl text-[#AAAAAA] mb-8 max-w-2xl mx-auto">
            Plataforma completa de inteligência crypto com análise em tempo real, 
            tracking de liquidações e monitoramento de volume anômalo
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-[#00E0FF] to-[#A6FF00] text-black font-bold px-8 py-3 rounded-lg hover:shadow-lg hover:shadow-[#00E0FF]/25 transition-all duration-300"
            >
              🚀 ACESSAR DASHBOARD
            </Button>
            <Button
              onClick={() => navigate('/liquidations')}
              variant="outline"
              className="border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5] px-8 py-3"
            >
              📊 Ver Liquidações
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(feature.route)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-black" />
                    </div>
                    {feature.status && (
                      <span className={`text-xs font-mono px-2 py-1 rounded ${
                        feature.status === 'NEW' ? 'bg-[#A6FF00] text-black' : 'bg-[#FF8C00] text-white'
                      }`}>
                        {feature.status}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-[#F5F5F5] font-mono group-hover:text-[#00E0FF] transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#AAAAAA] leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 w-full border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
                  >
                    ACESSAR →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Exchanges Monitoradas", value: "50+", icon: "📊" },
            { label: "Alertas por Dia", value: "1.2K+", icon: "🚨" },
            { label: "Precisão de Sinais", value: "94%", icon: "🎯" },
            { label: "Uptime Sistema", value: "99.9%", icon: "⚡" }
          ].map((stat, index) => (
            <Card key={index} className="bg-[#1C1C1E] border-[#2E2E2E] text-center">
              <CardContent className="pt-6">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-[#F5F5F5] font-mono">{stat.value}</div>
                <div className="text-sm text-[#AAAAAA]">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center border-t border-[#2E2E2E] pt-8">
          <p className="text-[#AAAAAA] text-sm">
            © 2024 Crypto Intel. Plataforma de análise crypto em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
