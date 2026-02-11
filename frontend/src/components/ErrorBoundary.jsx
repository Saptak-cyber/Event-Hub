import { Component } from 'react';
import { Button } from './ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                Oops! Something went wrong
              </h1>
              
              <p className="text-muted-foreground mb-6">
                We're sorry for the inconvenience. The application encountered an unexpected error.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-muted rounded-lg text-left">
                  <p className="text-sm font-mono text-destructive break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
