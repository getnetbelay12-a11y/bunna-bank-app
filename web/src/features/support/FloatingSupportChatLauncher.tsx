import { useState } from 'react';

import { SupportChatWorkspace } from './SupportChatWorkspace';

export function FloatingSupportChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-label="Open support chat panel"
        className="floating-support-button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="floating-support-icon" aria-hidden="true">
          💬
        </span>
        {unreadCount ? <span className="floating-support-badge">{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <section aria-label="Support Chat Panel" className="floating-support-panel">
          <div className="floating-support-panel-header">
            <div>
              <p className="eyebrow">Support</p>
              <h2>Support Chat</h2>
            </div>
            <button
              className="floating-support-close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
          <SupportChatWorkspace onUnreadChange={setUnreadCount} variant="panel" />
        </section>
      ) : (
        <div hidden>
          <SupportChatWorkspace onUnreadChange={setUnreadCount} variant="panel" />
        </div>
      )}
    </>
  );
}
