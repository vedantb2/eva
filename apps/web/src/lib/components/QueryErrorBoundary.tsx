import { Component, type ErrorInfo, type ReactNode } from "react";

interface QueryErrorBoundaryProps {
  children: ReactNode;
  /**
   * Rendered when a child query/render throws (e.g. missing Convex function).
   * Pass a function to get a `retry` that clears the error and re-renders the
   * children — a boundary with no way out stays broken until its parent
   * remounts, which for a persistent pane means a full page reload.
   */
  fallback?: ReactNode | ((retry: () => void) => ReactNode);
}

interface QueryErrorBoundaryState {
  hasError: boolean;
}

/**
 * Isolates Convex query failures so a single missing/broken subscription
 * cannot take down the whole layout (full-page error swap = major CLS).
 */
export class QueryErrorBoundary extends Component<
  QueryErrorBoundaryProps,
  QueryErrorBoundaryState
> {
  override state: QueryErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): QueryErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("QueryErrorBoundary caught:", error, info.componentStack);
  }

  private readonly retry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (typeof fallback === "function") return fallback(this.retry);
      return fallback ?? null;
    }
    return this.props.children;
  }
}
