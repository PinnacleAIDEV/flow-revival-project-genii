
import React from 'react';
import { Activity, BarChart3, Database, TrendingUp, Users, Zap, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: "Live Liquidations Monitor",
      description: "Monitoramento em tempo real de liquidações com precisão cirúrgica",
      action: () => navigate('/liquidations'),
      gradient: "from-red-500 to-orange-500"
    },
    {
      icon: TrendingUp,
      title: "Unusual Volume Detector",
      description: "Detecte movimentos institucionais antes que eles aconteçam",
      action: () => navigate('/unusual-volume'),
      gradient: "from-cyan-400 to-blue-500"
    },
    {
      icon: Database,
      title: "Historical Database",
      description: "Acesso a dados históricos com tecnologia AI avançada",
      action: () => navigate('/database'),
      gradient: "from-green-400 to-emerald-500"
    }
  ];

  const stats = [
    { label: "Liquidações Rastreadas", value: "1M+", icon: BarChart3 },
    { label: "Usuários Ativos", value: "10K+", icon: Users },
    { label: "Pontos de Dados", value: "100M+", icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-slate-800">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center relative">
                <Eye className="w-6 h-6 text-black" />
                <div className="absolute inset-0 bg-cyan-400/20 rounded-lg animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent font-mono">
                  AI PINNACLE
                </h1>
                <p className="text-xs text-gray-400 font-mono">Crypto Flow Intelligence System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-green-400 font-mono">
                🧠 ACESSO UNIVERSAL ATIVO
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 blur-3xl"></div>
            <h1 className="relative text-5xl md:text-7xl font-bold text-white mb-6 font-mono">
              OBSERVE O MERCADO
              <span className="block bg-gradient-to-r from-cyan-400 via-lime-400 to-green-400 bg-clip-text text-transparent">
                PELO OLHO DA IA
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Monitoramento de liquidações em tempo real com tecnologia AI. 
            <span className="text-cyan-400 font-bold block mt-2">
              "Não seja o liquidado. Seja o caçador."
            </span>
          </p>
          
          <Button 
            size="lg"
            onClick={() => navigate('/liquidations')}
            className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-black text-lg px-8 py-3 font-bold"
          >
            INICIAR MISSÃO 🧠
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                <div className="text-3xl font-bold text-white mb-1 font-mono">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group bg-gray-900/80 border-gray-700 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-400/10 transition-all duration-300 backdrop-blur-sm">
              <CardHeader>
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-4 relative`}>
                  <feature.icon className="w-6 h-6 text-white" />
                  <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <CardTitle className="text-xl font-bold text-white font-mono">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-6">{feature.description}</p>
                <Button 
                  onClick={feature.action}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-black font-bold transition-all"
                >
                  ACESSAR AGORA 👁
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-gray-700 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-lime-400/10"></div>
          <CardContent className="py-12 relative">
            <h2 className="text-3xl font-bold mb-4 text-white font-mono">SISTEMA OPERACIONAL</h2>
            <p className="text-xl mb-8 text-gray-300">
              Inteligência de mercado avançada com acesso total às funcionalidades
            </p>
            <p className="text-cyan-400 mb-6 font-mono text-sm">
              💥 Powered by Pinnacle TensorFlow AI™
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                size="lg"
                onClick={() => navigate('/liquidations')}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-lg px-8 py-3 font-bold"
              >
                LIQUIDATIONS 💥
              </Button>
              <Button 
                size="lg"
                onClick={() => navigate('/database')}
                className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-black text-lg px-8 py-3 font-bold"
              >
                DATABASE 📊
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
