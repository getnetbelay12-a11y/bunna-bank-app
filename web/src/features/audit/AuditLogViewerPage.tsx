import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type AuditLogViewerPageProps = {
  session: AdminSession;
};

export function AuditLogViewerPage({ session }: AuditLogViewerPageProps) {
  const { auditApi } = useAppClient();
  const [rows, setRows] = useState<string[][]>([['Loading', '...', '...', '...']]);

  useEffect(() => {
    let cancelled = false;

    void auditApi.getByEntity(session.role).then((result) => {
      if (!cancelled) {
        setRows(
          result.map((item) => [
            item.actor,
            item.action,
            item.entity,
            item.timestamp,
          ]),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auditApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="Audit Log Viewer"
        description="Inspect actor, entity, and before/after snapshots for sensitive business actions."
      >
        <SimpleTable
          headers={['Actor', 'Action', 'Entity', 'Timestamp']}
          rows={rows}
        />
      </Panel>
    </div>
  );
}
