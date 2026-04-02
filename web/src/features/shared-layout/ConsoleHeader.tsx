import { getRoleLabel, type AdminSession } from '../../core/session';

type ConsoleHeaderProps = {
  session: AdminSession;
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
        <p className="eyebrow">Management Console</p>
        <h2>{session.fullName}</h2>
        <p className="muted">
          {getRoleLabel(session.role)} · {scopeLabel}
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
