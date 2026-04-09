import { useState } from 'react';

import { FloatingChatButton } from '../../shared/components/BankingDashboard';
import { SupportChatWorkspace } from './SupportChatWorkspace';

export function FloatingSupportChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <>
      <FloatingChatButton
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      />

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
