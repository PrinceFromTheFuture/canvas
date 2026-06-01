"use client";

import * as React from "react";

/**
 * Error boundary for web rendering of (untrusted-but-scoped) report code.
 * Class components only work in Client Components, so this lives in its own
 * "use client" module and is exported only from the client entry - never from
 * /eval, which is reachable by the server graph.
 */
export class ReportErrorBoundary extends React.Component<
  { fallback?: React.ReactNode; children?: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { fallback?: React.ReactNode; children?: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div style={{ color: "#c0392b", padding: 16, fontFamily: "system-ui" }}>
            Failed to render report: {this.state.error.message}
          </div>
        )
      );
    }
    return this.props.children;
  }
}
