import {
  getSessionRoleLabel,
  isSchoolSession,
  type AppSession,
} from '../../core/session';

type ConsoleHeaderProps = {
  session: AppSession;
  scopeLabel: string;
  onLogout?: () => void;
};

export function ConsoleHeader({
  session,
  scopeLabel,
  onLogout,
}: ConsoleHeaderProps) {
  return (
    <header className="console-header">
      <div>
        <p className="eyebrow">{isSchoolSession(session) ? 'School Console' : 'Management Console'}</p>
        <h2>{session.fullName}</h2>
        <p className="muted">
          {getSessionRoleLabel(session)} · {scopeLabel}
        </p>
      </div>

      <div className="header-actions">
        <button className="header-chip" type="button">
          Notifications
        </button>
        {onLogout ? (
          <button className="header-chip primary" onClick={onLogout} type="button">
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}
