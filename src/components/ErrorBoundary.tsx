"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl bg-white p-8 text-center border border-rose-100 shadow-sm space-y-4 my-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <span className="material-symbols-rounded text-2xl">error</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {this.props.fallbackTitle || "Đã xảy ra lỗi khi tải nội dung này"}
          </h3>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto break-words bg-slate-50 p-3 rounded-xl border border-slate-100">
            {this.state.error?.message || "Lỗi không xác định"}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            Thử tải lại tab này
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
