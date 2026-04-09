import type { ReactNode } from 'react';

export function formatPanelLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function renderPanelAction(
  label: string,
  onClick?: () => void,
): ReactNode {
  if (!onClick) {
    return <span className="table-action-text muted">{label}</span>;
  }

  return (
    <button type="button" className="loan-watchlist-link" onClick={onClick}>
      {label}
    </button>
  );
}
