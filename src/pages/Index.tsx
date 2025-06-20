
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, Database, Eye, LayoutDashboard, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "DASHBOARD_CENTRAL",
      description: ">> ACCESS ALL CRYPTO ANALYSIS TOOLS IN ONE TERMINAL",
      icon: LayoutDashboard,
      route: "/dashboard",
      status: "NEW"
    },
    {
      title: "AIPINNACLE_PRO",
      description: ">> THE ONLY INDICATOR THAT DELETES FALSE SIGNALS",
      icon: Star,
      route: "/aipinnacle",
      status: "LAUNCH"
    },
    {
      title: "LIQUIDATION_TRACKER",
      description: ">> REAL-TIME LIQUIDATION MONITORING WITH INTERACTIVE VIZ",
      icon: TrendingUp,
      route: "/liquidations"
    },
    {
      title: "UNUSUAL_VOLUME_MONITOR",
      description: ">> DETECT ABNORMAL VOLUME SPIKES WITH 1MIN CANDLE ANALYSIS",
      icon: Eye,
      route: "/unusual-volume"
    },
    {
      title: "ARKHAM_INTELLIGENCE",
      description: ">> ON-CHAIN ANALYTICS AND WHALE TRACKING",
      icon: Activity,
      route: "/arkham",
      status: "BETA"
    },
    {
      title: "ASSET_DATABASE",
      description: ">> COMPLETE DATABASE WITH ADVANCED CRYPTO METRICS",
      icon: Database,
      route: "/database"
    }
  ];

  const stats = [
    { label: "EXCHANGES_MONITORED", value: "50+", ascii: "📊" },
    { label: "ALERTS_PER_DAY", value: "1.2K+", ascii: "🚨" },
    { label: "SIGNAL_ACCURACY", value: "94%", ascii: "🎯" },
    { label: "SYSTEM_UPTIME", value: "99.9%", ascii: "⚡" }
  ];

  return (
    <div className="min-h-screen bg-black grid-overlay">
      <div className="container mx-auto px-4 py-8">
        {/* ASCII Header */}
        <div className="text-center mb-12">
          <div className="ascii-divider"></div>
          <pre className="text-neon text-xs mb-4 font-mono leading-none">
{`
 ██████╗██████╗ ██╗   ██╗██████╗ ████████╗ ██████╗     ██╗███╗   ██╗████████╗███████╗██╗     
██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝██╔═══██╗    ██║████╗  ██║╚══██╔══╝██╔════╝██║     
██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║   ██║   ██║    ██║██╔██╗ ██║   ██║   █████╗  ██║     
██║     ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║   ██║   ██║    ██║██║╚██╗██║   ██║   ██╔══╝  ██║     
╚██████╗██║  ██║   ██║   ██║        ██║   ╚██████╔╝    ██║██║ ╚████║   ██║   ███████╗███████╗
 ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝    ╚═════╝     ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝
`}
          </pre>
          <div className="ascii-divider"></div>
          
          <div className="terminal p-6 mb-8 scanlines">
            <p className="text-electric font-mono-bold text-lg mb-4">
              &gt;&gt; COMPLETE CRYPTO INTELLIGENCE PLATFORM
            </p>
            <p className="text-neon font-mono text-sm leading-relaxed">
              REAL-TIME ANALYSIS // LIQUIDATION TRACKING // ANOMALOUS VOLUME MONITORING
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="brutal-btn px-8 py-4 text-lg font-display glitch"
              data-text=">> ACCESS DASHBOARD"
            >
              &gt;&gt; ACCESS DASHBOARD
            </button>
            <button
              onClick={() => navigate('/aipinnacle')}
              className="brutal-btn px-8 py-4 text-lg font-display glitch bg-electric text-black border-electric hover:bg-neon hover:border-neon"
              data-text=">> AIPINNACLE PRO"
            >
              ★ AIPINNACLE PRO
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="brutal-card p-6 cursor-pointer group scanlines"
                onClick={() => navigate(feature.route)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 border-2 border-electric bg-electric flex items-center justify-center group-hover:bg-neon group-hover:border-neon transition-colors">
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                  {feature.status && (
                    <div className={`px-2 py-1 text-xs font-mono-bold border-2 ${
                      feature.status === 'NEW' ? 'border-neon bg-neon text-black' : 
                      feature.status === 'LAUNCH' ? 'border-electric bg-electric text-black' :
                      'border-glitch-red bg-glitch-red text-black'
                    }`}>
                      [{feature.status}]
                    </div>
                  )}
                </div>
                
                <h3 className="font-display text-neon text-lg mb-3 group-hover:text-electric transition-colors glitch" data-text={feature.title}>
                  {feature.title}
                </h3>
                
                <p className="text-electric font-mono text-sm leading-relaxed mb-4">
                  {feature.description}
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

        {/* Stats Terminal */}
        <div className="terminal mb-12 scanlines">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center border-2 border-neon p-4">
                <div className="text-2xl mb-2">{stat.ascii}</div>
                <div className="text-2xl font-mono-bold text-electric">{stat.value}</div>
                <div className="text-sm font-mono text-neon">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ASCII Footer */}
        <div className="text-center border-t-2 border-neon pt-8">
          <div className="ascii-divider"></div>
          <p className="text-electric font-mono text-sm">
            © 2024 CRYPTO_INTEL // REAL-TIME CRYPTO ANALYSIS PLATFORM
          </p>
          <div className="ascii-divider"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
