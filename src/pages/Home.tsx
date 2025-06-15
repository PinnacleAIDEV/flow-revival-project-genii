
import React, { useState, useEffect } from 'react';
import { Activity, BarChart3, Database, TrendingUp, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AuthModal } from '../components/auth/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const features = [
    {
      icon: Activity,
      title: "Live Liquidations Monitor",
      description: "Real-time tracking of cryptocurrency liquidations across all major exchanges",
      action: () => navigate('/liquidations'),
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Unusual Volume Detector",
      description: "Identify significant volume spikes and unusual trading patterns",
      action: () => navigate('/unusual-volume'),
      gradient: "from-orange-500 to-yellow-500"
    },
    {
      icon: Database,
      title: "Historical Database",
      description: "Access comprehensive historical data and export capabilities",
      action: () => navigate('/database'),
      gradient: "from-blue-500 to-cyan-500"
    }
  ];

  const stats = [
    { label: "Liquidations Tracked", value: "1M+", icon: BarChart3 },
    { label: "Active Users", value: "10K+", icon: Users },
    { label: "Data Points", value: "100M+", icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <img src="/lovable-uploads/e928a4ae-7be9-44ed-82b2-a5faaf98584e.png" alt="Pinnacle" className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PINNACLE AI PRO
                </h1>
                <p className="text-xs text-gray-500">Crypto Flow Intelligence System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Professional Crypto
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Intelligence Platform
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Advanced real-time monitoring, analysis, and detection tools for cryptocurrency markets. 
            Stay ahead with AI-powered insights and comprehensive data tracking.
          </p>
          
          {!user && (
            <Button 
              size="lg"
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
            >
              Start Free Trial
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
              <CardHeader>
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <Button 
                  onClick={feature.action}
                  disabled={!user}
                  className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:text-white transition-all"
                  variant={user ? "default" : "outline"}
                >
                  {user ? 'Access Now' : 'Sign In Required'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        {!user && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of traders using Pinnacle AI Pro for market intelligence
              </p>
              <Button 
                size="lg"
                onClick={() => setShowAuthModal(true)}
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                Create Free Account
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Home;
