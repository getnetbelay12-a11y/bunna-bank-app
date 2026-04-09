import { useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import {
  getManagerConsoleKind,
  isSchoolSession,
  type AppSession,
} from '../../core/session';
import { Panel } from '../../shared/components/Panel';

type LoginPageProps = {
  onLogin: (session: AppSession) => void;
};

type LoginRoleMode = 'branch' | 'district' | 'head_office' | 'school';

const seededStaffAccounts: Record<
  LoginRoleMode,
  {
    heroLabel: string;
    title: string;
    helperText: string;
    identifier: string;
    password: string;
    scopeCue: string;
  }
> = {
  branch: {
    heroLabel: 'Branch',
    title: 'Secure Branch Staff Login',
    helperText:
      'Sign in to the branch workspace for branch employees, branch loans, branch support chats, and branch KYC queue visibility only.',
    identifier: 'manager.bahirdar-branch@bunnabank.com',
    password: 'demo-pass',
    scopeCue: 'Branch employees, branch loans, branch KYC, and branch support only.',
  },
  district: {
    heroLabel: 'District',
    title: 'Secure District Staff Login',
    helperText:
      'Sign in to the district workspace for branch performance, district loan escalations, and district support/service load within the assigned district only.',
    identifier: 'manager.north-district@bunnabank.com',
    password: 'demo-pass',
    scopeCue: 'District branch performance, district loans, and district support only.',
  },
  head_office: {
    heroLabel: 'Head Office',
    title: 'Secure Head Office Staff Login',
    helperText:
      'Sign in to the head office workspace for institution-wide approvals, district analytics, governance, risk, and enterprise support visibility.',
    identifier: 'admin.head-office@bunnabank.com',
    password: 'demo-pass',
    scopeCue: 'Institution-wide approvals, analytics, risk, and governance.',
  },
  school: {
    heroLabel: 'School',
    title: 'Secure School Console Login',
    helperText:
      'Sign in to the school workspace for student registry, billing, collections, onboarding, and school-side operations.',
    identifier: 'admin@bluenileacademy.school',
    password: 'demo-pass',
    scopeCue: 'Student registry, billing, collections, and school onboarding.',
  },
};

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return `${salutation}. Secure access is limited to your assigned Bunna Bank scope.`;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { authApi } = useAppClient();
  const [selectedRole, setSelectedRole] = useState<LoginRoleMode>('head_office');
  const [identifier, setIdentifier] = useState(
    seededStaffAccounts.head_office.identifier,
  );
  const [password, setPassword] = useState('demo-pass');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedConfig = seededStaffAccounts[selectedRole];
  const targetRoute = resolveTargetRoute(selectedRole);
  const greeting =
    selectedRole === 'school'
      ? 'Welcome back. School access is limited to your assigned school workspace.'
      : getGreeting('Staff');
  const heroEyebrow =
    selectedRole === 'school' ? 'School Console Access' : 'Bunna Bank Staff Access';
  const heroTitle =
    selectedRole === 'school' ? 'Secure School Console' : 'Secure Staff Console';
  const heroCopy =
    selectedRole === 'school'
      ? 'Choose the school workspace here first. The selected mode drives the school-side console experience after sign-in.'
      : 'Choose the staff scope here first. The selected role drives the active login mode, the right-side copy, and the scoped console workspace after sign-in.';

  return (
    <div className="standalone-page">
      <div className="login-layout">
        <section className="login-hero">
          <div className="login-hero-mark">
            <img src="/bunna-bank-logo.png?v=20260316" alt="Bunna Bank logo" className="brand-logo" />
          </div>
          <p className="eyebrow">{heroEyebrow}</p>
          <div className="login-brand-ribbon">BUNNA BANK</div>
          <h1>{heroTitle}</h1>
          <p className="login-hero-copy">{heroCopy}</p>
          <div className="loan-filter-row" style={{ marginTop: 16 }}>
            <a href="/portal/parent" className="channel-chip">
              Parent Payment Portal
            </a>
          </div>
          <div className="login-hero-metrics">
            {(Object.entries(seededStaffAccounts) as Array<
              [LoginRoleMode, (typeof seededStaffAccounts)[LoginRoleMode]]
            >).map(([role, config]) => (
              <button
                key={role}
                type="button"
                className={
                  selectedRole === role
                    ? 'login-metric login-metric-selected'
                    : 'login-metric'
                }
                aria-pressed={selectedRole === role}
                onClick={() => {
                  setSelectedRole(role);
                  setIdentifier(config.identifier);
                  setPassword(config.password);
                  setError(null);
                }}
              >
                <strong>{config.heroLabel}</strong>
                <span>{config.scopeCue}</span>
              </button>
            ))}
          </div>
        </section>

        <Panel
          title={selectedConfig.title}
          description={selectedConfig.helperText}
        >
          <form
            className="form-stack"
            onSubmit={async (event) => {
              event.preventDefault();
              setSubmitting(true);
              setError(null);

              try {
                const session = await authApi.login({
                  identifier,
                  password,
                });
                const resolvedScope = isSchoolSession(session)
                  ? 'school'
                  : getManagerConsoleKind(session.role);

                if (resolvedScope !== selectedRole) {
                  setError(
                    `This account is scoped for ${formatScopeName(
                      resolvedScope,
                    )}. Select ${formatScopeName(resolvedScope)} on the left to continue.`,
                  );
                  return;
                }

                if (!isSchoolSession(session)) {
                  window.sessionStorage.setItem('bunna_demo_role', session.role);
                }
                onLogin(session);
              } catch (_error) {
                setError('Sign-in failed. Check the staff identifier and password.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="login-scope-card">
              <span className="login-scope-label">Selected workspace</span>
              <strong>{formatScopeName(selectedRole)}</strong>
              <span className="login-scope-route">{targetRoute}</span>
            </div>
            <label className="login-field-label" htmlFor="staff-identifier">
              Staff Email or Identifier
            </label>
            <input
              id="staff-identifier"
              placeholder="Email or staff identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
            />
            <label className="login-field-label" htmlFor="staff-password">
              Password
            </label>
            <input
              id="staff-password"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="submit"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
            {error ? <p className="login-hint">{error}</p> : null}
            <p className="login-status-copy">{greeting}</p>
          </form>
        </Panel>
      </div>
    </div>
  );
}

function formatScopeName(scope: LoginRoleMode | 'support'): string {
  switch (scope) {
    case 'branch':
      return 'Branch';
    case 'district':
      return 'District';
    case 'head_office':
      return 'Head Office';
    case 'school':
      return 'School';
    default:
      return 'Support';
  }
}

function resolveTargetRoute(scope: LoginRoleMode) {
  switch (scope) {
    case 'branch':
      return '/console/branch/dashboard';
    case 'district':
      return '/console/district/dashboard';
    case 'school':
      return '/school-console';
    default:
      return '/console/head-office/dashboard';
  }
}
