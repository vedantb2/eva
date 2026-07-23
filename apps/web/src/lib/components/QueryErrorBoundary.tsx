import { Component, type ErrorInfo, type ReactNode } from "react";

interface QueryErrorBoundaryProps {
  children: ReactNode;
  /** Rendered when a child query/render throws (e.g. missing Convex function). */
  fallback?: ReactNode;
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
  state: QueryErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): QueryErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("QueryErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
