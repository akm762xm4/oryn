import React, { Component, type ReactNode } from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class NetworkErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a network-related error
    if (
      error.message.includes("Network Error") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("timeout")
    ) {
      return { hasError: true, error };
    }
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Network Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🌐</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Network Error
              </h2>
              <p className="text-muted-foreground mb-4">
                Unable to connect to the server. Please check your internet
                connection.
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks
export function NetworkErrorBoundary({ children, fallback }: Props) {
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📡</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            You're Offline
          </h2>
          <p className="text-muted-foreground mb-4">
            Please check your internet connection and try again.
          </p>
          <div className="animate-pulse text-sm text-muted-foreground">
            Waiting for connection...
          </div>
        </div>
      </div>
    );
  }

  return (
    <NetworkErrorBoundaryClass fallback={fallback}>
      {children}
    </NetworkErrorBoundaryClass>
  );
}
