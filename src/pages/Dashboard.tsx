
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Database, 
  Eye, 
  Search,
  Settings,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from '../components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface DashboardItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  status: 'active' | 'beta' | 'coming_soon';
  category: 'analytics' | 'tools' | 'data';
}

const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const dashboardItems: DashboardItem[] = [
    {
      id: 'unusual-volume',
      title: 'Unusual Volume Monitor',
      description: 'Detecta spikes de volume 3x+ em tempo real com análise de candles 1min',
      icon: Eye,
      route: '/unusual-volume',
      status: 'active',
      category: 'analytics'
    },
    {
      id: 'liquidations',
      title: 'Liquidation Tracker',
      description: 'Monitora liquidações em tempo real com bubble map interativo',
      icon: TrendingUp,
      route: '/liquidations',
      status: 'active',
      category: 'analytics'
    },
    {
      id: 'arkham',
      title: 'Arkham Intelligence',
      description: 'Analytics on-chain e whale tracking com dados da Arkham',
      icon: Search,
      route: '/arkham',
      status: 'beta',
      category: 'data'
    },
    {
      id: 'database',
      title: 'Asset Database',
      description: 'Base de dados completa de criptomoedas com métricas avançadas',
      icon: Database,
      route: '/database',
      status: 'active',
      category: 'data'
    },
    {
      id: 'sentiment',
      title: 'Market Sentiment',
      description: 'Análise de sentimento do mercado baseada em multiple data sources',
      icon: BarChart3,
      route: '/sentiment',
      status: 'coming_soon',
      category: 'analytics'
    },
    {
      id: 'social',
      title: 'Social Analytics',
      description: 'Tracking de menções em redes sociais e influenciadores crypto',
      icon: Users,
      route: '/social',
      status: 'coming_soon',
      category: 'analytics'
    }
  ];

  const analytics = dashboardItems.filter(item => item.category === 'analytics');
  const dataTools = dashboardItems.filter(item => item.category === 'data');
  const otherTools = dashboardItems.filter(item => item.category === 'tools');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#A6FF00] text-black';
      case 'beta': return 'bg-[#FF8C00] text-white';
      case 'coming_soon': return 'bg-[#2E2E2E] text-[#AAAAAA]';
      default: return 'bg-[#2E2E2E] text-[#AAAAAA]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'ATIVO';
      case 'beta': return 'BETA';
      case 'coming_soon': return 'EM BREVE';
      default: return 'INDISPONÍVEL';
    }
  };

  const menuItems = [
    { 
      title: "Overview", 
      id: "overview", 
      icon: LayoutDashboard 
    },
    { 
      title: "Analytics", 
      id: "analytics", 
      icon: BarChart3 
    },
    { 
      title: "Data Sources", 
      id: "data", 
      icon: Database 
    },
    { 
      title: "Tools", 
      id: "tools", 
      icon: Zap 
    },
    { 
      title: "Settings", 
      id: "settings", 
      icon: Settings 
    }
  ];

  const AppSidebar = () => (
    <Sidebar className="border-r border-[#2E2E2E]">
      <SidebarHeader className="p-4 border-b border-[#2E2E2E]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-[#00E0FF] to-[#A6FF00] rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="font-bold text-[#F5F5F5] font-mono">CRYPTO INTEL</h2>
            <p className="text-xs text-[#AAAAAA]">Analytics Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#AAAAAA] text-xs uppercase font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                      className="text-[#AAAAAA] hover:text-[#F5F5F5] hover:bg-[#2E2E2E] data-[active=true]:bg-[#00E0FF]/20 data-[active=true]:text-[#00E0FF]"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  const renderDashboardSection = (items: DashboardItem[], title: string) => (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-[#F5F5F5] font-mono mb-4 flex items-center space-x-2">
        <span className="text-[#00E0FF]">▶</span>
        <span>{title}</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card 
              key={item.id} 
              className="bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-all duration-300 cursor-pointer group"
              onClick={() => {
                if (item.status === 'active' || item.status === 'beta') {
                  window.location.href = item.route;
                }
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#00E0FF] to-[#A6FF00] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="text-[#F5F5F5] font-mono text-sm">{item.title}</h4>
                    </div>
                  </div>
                  <Badge className={`text-xs font-mono ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#AAAAAA] leading-relaxed">
                  {item.description}
                </p>
                {(item.status === 'active' || item.status === 'beta') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5] text-xs"
                  >
                    ACESSAR →
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#F5F5F5] font-mono mb-2">
                Dashboard Overview 📊
              </h2>
              <p className="text-[#AAAAAA]">
                Central de controle para todas as ferramentas de análise crypto
              </p>
            </div>
            
            {renderDashboardSection(analytics, 'ANALYTICS TOOLS')}
            {renderDashboardSection(dataTools, 'DATA SOURCES')}
            {renderDashboardSection(otherTools, 'OTHER TOOLS')}
          </div>
        );
      
      case 'analytics':
        return (
          <div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] font-mono mb-6">
              Analytics Tools 📈
            </h2>
            {renderDashboardSection(analytics, 'FERRAMENTAS DE ANÁLISE')}
          </div>
        );
      
      case 'data':
        return (
          <div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] font-mono mb-6">
              Data Sources 💾
            </h2>
            {renderDashboardSection(dataTools, 'FONTES DE DADOS')}
          </div>
        );
      
      default:
        return (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold text-[#F5F5F5] font-mono mb-4">
              {activeSection.toUpperCase()} 🚧
            </h2>
            <p className="text-[#AAAAAA]">Seção em desenvolvimento...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1E] to-[#0A0A0A]">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6 bg-[#1C1C1E]/90 backdrop-blur-md rounded-lg p-4 border border-[#2E2E2E]">
                <SidebarTrigger className="text-[#AAAAAA] hover:text-[#F5F5F5]" />
                <div className="h-6 w-px bg-[#2E2E2E]" />
                <div>
                  <h1 className="text-xl font-bold text-[#F5F5F5] font-mono">
                    CRYPTO INTELLIGENCE DASHBOARD
                  </h1>
                  <p className="text-sm text-[#AAAAAA]">
                    Plataforma completa de análise e monitoramento crypto
                  </p>
                </div>
              </div>
              
              {renderContent()}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Dashboard;
