
import React, { useState } from 'react';
import { X, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "🧠 Acesso Neural Concedido!",
          description: "Bem-vindo ao AI Pinnacle.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast({
          title: "🔒 Conta Criada!",
          description: "Verifique seu email para ativar sua conta neural.",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "❌ Erro de Acesso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative bg-gray-900 border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-2 top-2 h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center relative">
              <Eye className="w-5 h-5 text-black" />
              <div className="absolute inset-0 bg-cyan-400/20 rounded-lg animate-pulse"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-mono">
              AI PINNACLE
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-white font-mono">
            {isLogin ? 'ACESSO NEURAL' : 'REGISTRO NEURAL'}
          </CardTitle>
          <p className="text-gray-400">
            {isLogin ? 'Entre no sistema de IA' : 'Crie sua conta neural'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email neural"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-cyan-400"
              />
            </div>
            
            <div>
              <Input
                type="password"
                placeholder="Código de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-cyan-400"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-black font-bold"
              disabled={loading}
            >
              {loading ? 'PROCESSANDO...' : (isLogin ? 'CONECTAR 🧠' : 'REGISTRAR 👁')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? "Não possui acesso neural?" : "Já possui conta neural?"}
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 p-0 h-auto text-cyan-400 hover:text-cyan-300"
              >
                {isLogin ? 'Registrar' : 'Conectar'}
              </Button>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 font-mono">
              💥 Powered by Pinnacle TensorFlow AI™
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
