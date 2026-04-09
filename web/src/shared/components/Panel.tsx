import type { PropsWithChildren } from 'react';

type PanelProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function Panel({ title, description, children }: PanelProps) {
  return (
    <section className="panel legacy-panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {description ? <p className="muted">{description}</p> : null}
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
