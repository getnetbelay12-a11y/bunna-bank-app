import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  SupportChatDetail,
  SupportChatSummaryItem,
} from '../../core/api/contracts';

type SupportChatWorkspaceProps = {
  variant?: 'page' | 'panel';
  onUnreadChange?: (count: number) => void;
};

export function SupportChatWorkspace({
  variant = 'page',
  onUnreadChange,
}: SupportChatWorkspaceProps) {
  const { supportApi } = useAppClient();
  const [openChats, setOpenChats] = useState<SupportChatSummaryItem[]>([]);
  const [assignedChats, setAssignedChats] = useState<SupportChatSummaryItem[]>([]);
  const [resolvedChats, setResolvedChats] = useState<SupportChatSummaryItem[]>([]);
  const [selected, setSelected] = useState<SupportChatDetail | null>(null);
  const [reply, setReply] = useState('Thank you. I am reviewing your request now.');
  const [error, setError] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    void loadQueues();

    const intervalId = window.setInterval(() => {
      void loadQueues();
      if (selected?.conversationId) {
        void loadDetail(selected.conversationId);
      }
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [supportApi, selected?.conversationId]);

  const unreadCount = useMemo(
    () =>
      [...openChats, ...assignedChats].filter((item) =>
        ['open', 'assigned', 'waiting_agent'].includes(item.status),
      ).length,
    [assignedChats, openChats],
  );

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [onUnreadChange, unreadCount]);

  async function loadQueues() {
    try {
      const [open, assigned, resolved] = await Promise.all([
        supportApi.getOpenChats(),
        supportApi.getAssignedChats(),
        supportApi.getResolvedChats(),
      ]);
      setOpenChats(open);
      setAssignedChats(assigned);
      setResolvedChats(resolved);
      setError(null);
    } catch (_error) {
      setError('Unable to load support queues right now.');
    }
  }

  async function loadDetail(chatId: string) {
    try {
      const detail = await supportApi.getChat(chatId);
      setSelected(detail);
      setError(null);
    } catch (_error) {
      setError('Unable to load this support conversation.');
    }
  }

  async function assignCurrent() {
    if (!selected) {
      return;
    }

    try {
      const detail = await supportApi.assignChat(selected.conversationId);
      setSelected(detail);
      setError(null);
      await loadQueues();
    } catch (_error) {
      setError('Unable to assign this support conversation.');
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) {
      return;
    }

    try {
      setSendingReply(true);
      const detail = await supportApi.reply(selected.conversationId, reply.trim());
      setSelected(detail);
      setReply('');
      setError(null);
      await loadQueues();
    } catch (_error) {
      setError('Unable to send the support reply.');
    } finally {
      setSendingReply(false);
    }
  }

  async function updateCurrentStatus(status: 'resolved' | 'closed') {
    if (!selected) {
      return;
    }

    try {
      const detail =
        status === 'resolved'
          ? await supportApi.resolve(selected.conversationId)
          : await supportApi.close(selected.conversationId);
      setSelected(detail);
      setError(null);
      await loadQueues();
    } catch (_error) {
      setError(`Unable to mark this support conversation as ${status}.`);
    }
  }

  return (
    <div
      className={
        variant === 'panel'
          ? 'support-workspace support-workspace-panel'
          : 'support-workspace support-workspace-page'
      }
    >
      <section className="panel support-queue-panel">
        <div className="panel-header support-panel-header">
          <div>
            <p className="eyebrow">Support</p>
            <h2>{variant === 'panel' ? 'Support Chat' : 'Support Chat Inbox'}</h2>
          </div>
          <span className="support-status-dot">
            {unreadCount} waiting
          </span>
        </div>
        {error ? <p className="muted">{error}</p> : null}

        <SupportQueueSection
          items={openChats}
          onSelect={loadDetail}
          title="Open Chats"
        />
        <SupportQueueSection
          items={assignedChats}
          onSelect={loadDetail}
          title="Assigned Chats"
        />
        <SupportQueueSection
          items={resolvedChats}
          onSelect={loadDetail}
          title="Resolved Chats"
        />
      </section>

      <section className="panel support-detail-panel">
        <div className="panel-header support-panel-header">
          <div>
            <p className="eyebrow">Conversation</p>
            <h2>
              {selected ? selected.memberName ?? selected.customerId : 'Select a support conversation'}
            </h2>
          </div>
          {selected ? (
            <span className={`support-status-pill ${statusClassName(selected.status)}`}>
              {formatStatus(selected.status)}
            </span>
          ) : null}
        </div>

        {selected ? (
          <>
            <div className="support-detail-meta">
              <span>{selected.memberType}</span>
              <span>{selected.issueCategory.replace(/_/g, ' ')}</span>
              <span>{selected.branchName ?? 'Bunna Bank'}</span>
              {selected.priority ? <span>{selected.priority}</span> : null}
              {selected.assignedToStaffName ? (
                <span>{selected.assignedToStaffName}</span>
              ) : null}
            </div>
            <div className="conversation-timeline support-conversation-list">
              {selected.messages.map((message) => (
                <div className="timeline-item" key={message.id}>
                  <strong>{message.senderName ?? message.senderType}</strong>
                  <p>{message.message}</p>
                  <span className="muted">{formatTimestamp(message.createdAt)}</span>
                </div>
              ))}
            </div>
            <div className="support-composer">
              <div className="support-composer-header">
                <div>
                  <strong>Reply to Customer</strong>
                  <p className="muted">Send a live reply back to the mobile app.</p>
                </div>
                <button
                  className="support-send-button"
                  disabled={!reply.trim() || sendingReply}
                  onClick={() => void sendReply()}
                  type="button"
                >
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
              <textarea
                className="reply-box"
                onChange={(event) => setReply(event.target.value)}
                placeholder="Type your reply to the customer"
                rows={4}
                value={reply}
              />
            </div>
            <div className="action-row">
              <button
                className="support-secondary-button"
                onClick={() => void assignCurrent()}
                type="button"
              >
                Assign To Me
              </button>
              <button
                className="support-secondary-button"
                onClick={() => void updateCurrentStatus('resolved')}
                type="button"
              >
                Resolve
              </button>
              <button
                className="support-secondary-button"
                onClick={() => void updateCurrentStatus('closed')}
                type="button"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <p className="muted">
            Open a conversation to view customer details, shared message history, and
            support actions.
          </p>
        )}
      </section>
    </div>
  );
}

type SupportQueueSectionProps = {
  title: string;
  items: SupportChatSummaryItem[];
  onSelect: (chatId: string) => Promise<void>;
};

function SupportQueueSection({ title, items, onSelect }: SupportQueueSectionProps) {
  return (
    <div className="support-queue-section">
      <div className="support-queue-heading">
        <h3>{title}</h3>
        <span className="muted">{items.length}</span>
      </div>
      {items.length ? (
        items.map((item) => (
          <button
            key={item.conversationId}
            className="table-row-button support-chat-row"
            onClick={() => void onSelect(item.conversationId)}
            type="button"
          >
            <div className="support-chat-row-top">
              <strong>{item.memberName ?? item.customerId}</strong>
              <span className={`support-status-pill ${statusClassName(item.status)}`}>
                {formatStatus(item.status)}
              </span>
            </div>
            <div className="support-chat-row-meta">
              <span>{item.issueCategory.replace(/_/g, ' ')}</span>
              <span>{item.branchName ?? 'Bunna Bank'}</span>
              <span>{formatTimestamp(item.updatedAt)}</span>
            </div>
            <span className="support-chat-row-message">{item.lastMessage}</span>
          </button>
        ))
      ) : (
        <p className="muted">No conversations in this queue right now.</p>
      )}
    </div>
  );
}

function formatTimestamp(value?: string) {
  if (!value) {
    return 'n/a';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function statusClassName(status: string) {
  switch (status) {
    case 'waiting_agent':
    case 'open':
      return 'support-status-waiting-agent';
    case 'waiting_customer':
      return 'support-status-waiting-customer';
    case 'resolved':
      return 'support-status-resolved';
    case 'assigned':
      return 'support-status-assigned';
    default:
      return 'support-status-default';
  }
}
