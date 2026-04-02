import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type NotificationsCenterPageProps = {
  session: AdminSession;
};

export function NotificationsCenterPage({
  session,
}: NotificationsCenterPageProps) {
  const { notificationApi } = useAppClient();
  const [rows, setRows] = useState<string[][]>([['Loading', '...', '...', '...']]);

  useEffect(() => {
    let cancelled = false;

    void notificationApi.getNotifications(session.role).then((result) => {
      if (!cancelled) {
        setRows(
          result.map((item) => [
            item.type,
            item.userLabel,
            item.status,
            item.sentAt,
          ]),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [notificationApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="Notifications Center"
        description="Staff and member-facing notifications should be searchable and filterable here."
      >
        <SimpleTable headers={['Type', 'User', 'Status', 'Sent']} rows={rows} />
      </Panel>
    </div>
  );
}
