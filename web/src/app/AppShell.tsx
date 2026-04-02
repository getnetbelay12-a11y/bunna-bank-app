import React, { useState } from 'react';

import { createAppClient } from '../core/api/appClient';
import type { AdminSession } from '../core/session';
import { LoginPage } from '../features/login/LoginPage';
import { DashboardShell } from '../features/layout/DashboardShell';
import { AppClientContext } from './AppContext';

const appClient = createAppClient();

class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { hasError: boolean; message: string }
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || 'Console startup failed.',
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="standalone-page">
          <div className="panel">
            <h1>Console configuration error</h1>
            <p>{this.state.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AppShell() {
  const [session, setSession] = useState<AdminSession | null>(null);

  return (
    <AppErrorBoundary>
      <AppClientContext.Provider value={appClient}>
        {session ? (
          <DashboardShell session={session} onLogout={() => setSession(null)} />
        ) : (
          <LoginPage onLogin={setSession} />
        )}
      </AppClientContext.Provider>
    </AppErrorBoundary>
  );
}
