import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Componente de Barreira de Erros para evitar tela branca em caso de falha crítica
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Você também pode logar o erro para um serviço de reporte de erros
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Renderiza qualquer UI de fallback
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white p-6 text-center font-sans">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
              O sistema encontrou um erro inesperado. Tente recarregar a página.
            </p>
            
            {this.state.error && (
                <div className="mb-6 text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Detalhes do Erro:</p>
                    <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded text-red-600 dark:text-red-400 overflow-auto max-h-32 border border-slate-200 dark:border-slate-700">
                        {this.state.error.toString()}
                    </pre>
                </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Reiniciar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>
);