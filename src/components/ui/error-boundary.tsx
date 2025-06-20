
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Algo deu errado</h2>
          <p className="text-gray-600 mb-4 max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato conosco se o problema persistir.
          </p>
          {this.state.error && (
            <details className="mb-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
              <summary className="cursor-pointer font-medium">Detalhes do erro</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <Button onClick={this.handleRetry} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Tentar novamente</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
