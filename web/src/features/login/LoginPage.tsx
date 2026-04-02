import { useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';

type LoginPageProps = {
  onLogin: (session: AdminSession) => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const { authApi } = useAppClient();
  const [identifier, setIdentifier] = useState('admin@bunna.local');
  const [password, setPassword] = useState('Bunna123!');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin() {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const session = await authApi.login({
        identifier: identifier.trim(),
        password,
      });

      window.sessionStorage.setItem('bunna_demo_role', session.role);
      onLogin(session);
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : 'Unable to sign in right now.';
      const message = /invalid credentials/i.test(rawMessage)
        ? 'Invalid email or password.'
        : rawMessage;
      console.error('Bunna manager console login failed:', {
        identifier: identifier.trim(),
        reason: rawMessage,
      });
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="standalone-page">
      <div className="login-layout">
        <section className="login-hero">
          <div className="login-hero-mark">
            <img src="/bunna-bank-logo.png" alt="Bunna Bank logo" className="brand-logo" />
          </div>
          <p className="eyebrow">Bunna Bank</p>
          <h1>Manager Console</h1>
          <p className="login-hero-copy">
            Monitor branches, district operations, KYC queues, support traffic, and loan
            performance from one branded control surface.
          </p>
          <div className="login-hero-metrics">
            <div className="login-metric">
              <strong>Branch</strong>
              <span>Operational visibility</span>
            </div>
            <div className="login-metric">
              <strong>District</strong>
              <span>Risk and staffing signals</span>
            </div>
            <div className="login-metric">
              <strong>Head Office</strong>
              <span>Enterprise oversight</span>
            </div>
          </div>
        </section>

        <Panel
          title="Secure Staff Login"
          description="Use a Bunna head-office email or the demo aliases admin / head_office for Head Office access."
        >
          <div className="form-stack">
            <input
              placeholder="Head Office email or demo alias"
              value={identifier}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              spellCheck={false}
              onChange={(event) => {
                setIdentifier(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
            />
            <input
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
            />
            <button
              type="button"
              onClick={handleLogin}
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
            {errorMessage ? (
              <p role="alert" className="muted">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
