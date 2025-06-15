
import React, { useState, useEffect } from 'react';
import { Star, Clock, Shield, Zap, TrendingUp, CheckCircle, XCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AIPinnacle = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  const [licensesLeft, setLicensesLeft] = useState(87);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: "Sistema de Validação em Tempo Real",
      description: "IA filtra sinais ruins ANTES de aparecer para você",
      result: "Você só vê sinais PRÉ-VALIDADOS"
    },
    {
      title: "Classificação por Estrelas AO VIVO",
      description: "Qualidade do sinal evoluindo em tempo real",
      result: "⭐⭐⭐⭐⭐ Você VÊ a qualidade evoluindo!"
    },
    {
      title: "Golden Zone - O Período Dourado",
      description: "Detecta momentos de alta probabilidade",
      result: "Sinalizando possível GRANDE MOVIMENTO"
    },
    {
      title: "Zonas DONT TRADE IA",
      description: "Proteção inteligente contra armadilhas",
      result: "Bloqueia sinais em zonas perigosas"
    }
  ];

  const stats = [
    { label: "Taxa de Acerto", value: "78-85%", icon: "🎯" },
    { label: "Redução de Sinais Falsos", value: "-73%", icon: "🚫" },
    { label: "Sinais por Dia", value: "20-80", icon: "📊" },
    { label: "Timeframes Suportados", value: "1min ao Diário", icon: "⏱️" }
  ];

  const bonuses = [
    { name: "Preset Agressivo + Conservador", value: "R$ 297" },
    { name: "Guia \"Dominando as 5 Estrelas\"", value: "R$ 197" },
    { name: "3 Mentorias em Grupo", value: "R$ 597" },
    { name: "Indicador \"Momentum Gold\"", value: "R$ 397" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1E] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center relative">
              <TrendingUp className="w-8 h-8 text-black" />
              <div className="absolute inset-0 bg-[#FFD700]/20 rounded-xl animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-[#F5F5F5] font-mono">
                AI<span className="text-[#FFD700]">PINNACLE</span>
              </h1>
              <p className="text-sm text-[#FFD700] font-mono">A Última Evolução em Trading Inteligente</p>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F5] mb-4 leading-tight">
            O Único Indicador que <span className="text-[#FF4D4D]">DELETA</span> Sinais Falsos<br />
            <span className="text-[#FFD700]">Antes que Você os Veja</span>
          </h2>
          
          <p className="text-xl text-[#AAAAAA] mb-8 max-w-4xl mx-auto">
            Descubra o Sistema de Trading com IA que Filtra <span className="text-[#A6FF00] font-bold">73%</span> dos Sinais Ruins AUTOMATICAMENTE - 
            Mostrando Apenas Oportunidades <span className="text-[#FFD700]">3 a 5 Estrelas</span>
          </p>
        </div>

        {/* Oferta Principal */}
        <Card className="bg-gradient-to-r from-[#1C1C1E] to-[#2A2A2E] border-[#FFD700] border-2 mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500]"></div>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <Zap className="w-6 h-6 text-[#FFD700]" />
              <CardTitle className="text-2xl font-bold text-[#FFD700]">LANÇAMENTO EXCLUSIVO: 15 DE JULHO</CardTitle>
              <Zap className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div className="text-4xl font-bold text-[#F5F5F5] mb-2">
              APENAS <span className="text-[#FF4D4D]">100</span> LICENÇAS VITALÍCIAS
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-[#FF4D4D] mb-2">
                  R$ 1.997
                </div>
                <div className="text-2xl text-[#AAAAAA] line-through mb-2">R$ 3.997</div>
                <div className="text-lg text-[#A6FF00] font-bold">VITALÍCIO</div>
                <div className="text-sm text-[#AAAAAA] mt-2">
                  Após esgotadas: R$ 200/mês
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg text-[#FFD700] font-bold mb-4">CONTADOR REGRESSIVO</div>
                <div className="flex justify-center space-x-4 mb-6">
                  <div className="bg-[#2A2A2E] p-4 rounded-lg">
                    <div className="text-2xl font-bold text-[#FFD700]">{timeLeft.hours.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-[#AAAAAA]">HORAS</div>
                  </div>
                  <div className="bg-[#2A2A2E] p-4 rounded-lg">
                    <div className="text-2xl font-bold text-[#FFD700]">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-[#AAAAAA]">MIN</div>
                  </div>
                  <div className="bg-[#2A2A2E] p-4 rounded-lg">
                    <div className="text-2xl font-bold text-[#FFD700]">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-[#AAAAAA]">SEG</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-[#AAAAAA] mb-2">Licenças Restantes:</div>
                  <div className="w-full bg-[#2A2A2E] rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-[#FF4D4D] to-[#FFD700] h-4 rounded-full transition-all duration-300" 
                      style={{width: `${licensesLeft}%`}}
                    ></div>
                  </div>
                  <div className="text-lg font-bold text-[#FF4D4D] mt-2">{licensesLeft}/100</div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold px-12 py-4 text-xl rounded-lg hover:shadow-lg hover:shadow-[#FFD700]/25 transition-all duration-300 mb-4">
                🚀 GARANTIR MINHA LICENÇA VITALÍCIA
              </Button>
              <div className="text-sm text-[#AAAAAA]">
                🔒 Pagamento Seguro • 🏦 Parcelamento em até 12x
              </div>
            </div>
          </CardContent>
        </Card>

        {/* O que torna único */}
        <div className="mb-16">
          <h3 className="text-4xl font-bold text-[#F5F5F5] text-center mb-12">
            🏆 O QUE TORNA O <span className="text-[#FFD700]">PINNACLE AI PRO</span> ÚNICO
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#FFD700]/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-[#F5F5F5] flex items-center">
                    <span className="text-[#FFD700] text-2xl mr-3">{index + 1}️⃣</span>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#AAAAAA] mb-4">
                    {feature.description}
                  </CardDescription>
                  <div className="text-[#A6FF00] font-bold">
                    ✅ {feature.result}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resultados Reais */}
        <div className="mb-16">
          <h3 className="text-4xl font-bold text-[#F5F5F5] text-center mb-12">
            📊 RESULTADOS REAIS
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-[#1C1C1E] border-[#2E2E2E] text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-[#FFD700]">{stat.value}</div>
                  <div className="text-sm text-[#AAAAAA]">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Para Quem É */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-[#1C1C1E] border-[#A6FF00]">
            <CardHeader>
              <CardTitle className="text-[#A6FF00] flex items-center">
                <CheckCircle className="w-6 h-6 mr-2" />
                🎯 PARA QUEM É
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-[#AAAAAA]">
                <div className="flex items-center"><CheckCircle className="w-4 h-4 text-[#A6FF00] mr-2" />Day Traders que perderam dinheiro com sinais falsos</div>
                <div className="flex items-center"><CheckCircle className="w-4 h-4 text-[#A6FF00] mr-2" />Scalpers que precisam de precisão cirúrgica</div>
                <div className="flex items-center"><CheckCircle className="w-4 h-4 text-[#A6FF00] mr-2" />Iniciantes que querem aprender com sinais validados</div>
                <div className="flex items-center"><CheckCircle className="w-4 h-4 text-[#A6FF00] mr-2" />Experientes que buscam confirmação extra</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1C1C1E] border-[#FF4D4D]">
            <CardHeader>
              <CardTitle className="text-[#FF4D4D] flex items-center">
                <XCircle className="w-6 h-6 mr-2" />
                ❌ NÃO É PARA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[#AAAAAA]">
                <div className="flex items-center"><XCircle className="w-4 h-4 text-[#FF4D4D] mr-2" />Quem busca riqueza overnight</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funcionalidades Premium */}
        <div className="mb-16">
          <h3 className="text-4xl font-bold text-[#F5F5F5] text-center mb-12">
            💡 FUNCIONALIDADES PREMIUM
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              "Multi-Timeframe: Scalp/Daytrade/Swing",
              "Stop Loss Automático: 3 níveis de Alavancagem (50x, 100x, 400x)",
              "4 Take Profits: Calculados por IA",
              "Dashboard Completo: Todas métricas em tempo real",
              "Alertas Sonoros: Para sinais 4-5 estrelas",
              "Pullback Detection: Entradas em correções"
            ].map((feature, index) => (
              <div key={index} className="bg-[#1C1C1E] border border-[#2E2E2E] p-4 rounded-lg">
                <div className="text-[#A6FF00] font-bold">✅ {feature}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bônus Exclusivos */}
        <Card className="bg-gradient-to-r from-[#1C1C1E] to-[#2A2A2E] border-[#FFD700] border-2 mb-12">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-[#FFD700] text-center flex items-center justify-center">
              <Gift className="w-8 h-8 mr-3" />
              ⚡ BÔNUS EXCLUSIVOS (Apenas Vitalícios)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {bonuses.map((bonus, index) => (
                <div key={index} className="bg-[#2A2A2E] p-4 rounded-lg border border-[#FFD700]/30">
                  <div className="text-[#FFD700] font-bold">🎁 BÔNUS {index + 1}:</div>
                  <div className="text-[#F5F5F5]">{bonus.name}</div>
                  <div className="text-[#A6FF00] font-bold">({bonus.value})</div>
                </div>
              ))}
            </div>
            <div className="text-center text-2xl font-bold text-[#FFD700]">
              Total em Bônus: R$ 1.488
            </div>
          </CardContent>
        </Card>

        {/* Garantias */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: <Shield className="w-8 h-8" />, title: "Suporte Vitalício", desc: "Grupo VIP no Discord" },
            { icon: <Zap className="w-8 h-8" />, title: "Atualizações Grátis", desc: "Para sempre (vitalícios)" },
            { icon: <Clock className="w-8 h-8" />, title: "30 Dias de Garantia", desc: "Devolução sem perguntas" }
          ].map((guarantee, index) => (
            <Card key={index} className="bg-[#1C1C1E] border-[#A6FF00] text-center">
              <CardContent className="pt-6">
                <div className="text-[#A6FF00] flex justify-center mb-4">{guarantee.icon}</div>
                <div className="text-[#F5F5F5] font-bold mb-2">🛡️ {guarantee.title}</div>
                <div className="text-[#AAAAAA]">✅ {guarantee.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Urgência */}
        <Card className="bg-[#1C1C1E] border-[#FF4D4D] border-2 mb-12">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-[#FF4D4D] text-center">
              🚨 URGÊNCIA REAL
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-2 text-xl">
              <div className="text-[#FF4D4D] font-bold">🔴 100 LICENÇAS VITALÍCIAS DISPONÍVEIS</div>
              <div className="text-[#FFD700] font-bold">🟡 VELOCIDADE DE VENDAS: ~8-12/hora esperado</div>
              <div className="text-[#A6FF00] font-bold">🟢 Quando acabar: R$ 200/mês PARA SEMPRE</div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Final */}
        <div className="text-center mb-12">
          <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold px-16 py-6 text-2xl rounded-lg hover:shadow-lg hover:shadow-[#FFD700]/25 transition-all duration-300 mb-6">
            🚀 GARANTIR MINHA LICENÇA VITALÍCIA
          </Button>
          <div className="text-sm text-[#AAAAAA] mb-8">
            🔒 Pagamento Seguro • 🏦 Parcelamento em até 12x
          </div>
          
          <div className="bg-[#1C1C1E] border border-[#FF8C00] p-6 rounded-lg max-w-4xl mx-auto">
            <div className="text-[#FF8C00] font-bold mb-2">⚠️ AVISO IMPORTANTE:</div>
            <div className="text-[#AAAAAA] text-sm">
              Este não é um sistema "fique rico rápido". É uma ferramenta profissional que requer estudo e disciplina. 
              Resultados variam conforme experiência e gestão de risco.
            </div>
          </div>
        </div>

        {/* Suporte */}
        <Card className="bg-[#1C1C1E] border-[#2E2E2E]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#F5F5F5] text-center">
              📞 SUPORTE PRÉ-VENDA
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-2 text-[#AAAAAA]">
              <div>📱 WhatsApp: [Número]</div>
              <div>📧 Email: suporte@pinnacleaipro.com</div>
              <div>🕘 Horário: 9h às 18h (Seg-Sex)</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIPinnacle;
