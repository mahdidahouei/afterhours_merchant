import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/errors";
import { ErrorState } from "@/ui/ErrorState";

type Props = {
  children: ReactNode;
  /** Rendered instead of the default panel. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Changing this resets the boundary — pass the route path to clear on navigation. */
  resetKey?: unknown;
};

type State = { error: Error | null };

/**
 * Catches render-time crashes so one broken section can't blank the whole page.
 *
 * React has no hook equivalent: only a class component can implement
 * `componentDidCatch`. This is the app's single class component for that reason.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack ?? undefined });
  }

  componentDidUpdate(prevProps: Props) {
    // Navigating away from a broken screen should not keep showing the error.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);

    return (
      <div className="flex min-h-[320px] items-center justify-center p-8">
        <ErrorState
          message="This section failed to load."
          onRetry={this.reset}
          retryText="Try again"
        />
      </div>
    );
  }
}
