import React from 'react';

/**
 * ErrorBoundary Component for React Web App
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 * 
 * Or with custom fallback:
 *   <ErrorBoundary fallback={<CustomErrorUI />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('📍 Component stack:', errorInfo?.componentStack);
    
    // Store error info for display
    this.setState({ errorInfo });
    
    // TODO: In production, send to error reporting service (e.g., Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   sendToErrorReporting(error, errorInfo);
    // }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
          <div className="w-full max-w-md p-8 text-center bg-white shadow-xl rounded-2xl">
            {/* Warning Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <svg 
                className="w-8 h-8 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Something went wrong
            </h2>
            
            <p className="mb-6 text-gray-600">
              The application encountered an unexpected error. Please try again.
            </p>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="p-4 mb-6 overflow-auto text-left rounded-lg bg-red-50 max-h-40">
                <p className="mb-1 text-xs font-semibold text-red-800">
                  Error Details (Dev Only):
                </p>
                <p className="font-mono text-xs text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <p className="mt-2 font-mono text-xs text-gray-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.substring(0, 300)}...
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 font-semibold text-white transition-colors rounded-lg bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
