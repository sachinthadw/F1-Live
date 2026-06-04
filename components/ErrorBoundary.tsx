import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[VelocityX] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white gap-6 p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
            <AlertTriangle className="w-16 h-16 text-red-500 relative z-10" />
          </div>
          
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold tracking-tight mb-2">SYSTEM FAILURE</h1>
            <p className="text-sm text-gray-400 font-mono tracking-wide mb-1">
              TELEMETRY LINK INTERRUPTED
            </p>
            <p className="text-xs text-gray-500 font-mono mt-4 bg-white/5 p-3 rounded-lg border border-white/10 text-left break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-sm font-medium transition-all cursor-pointer group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            RECONNECT
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
