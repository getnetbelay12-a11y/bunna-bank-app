import { SupportChatWorkspace } from './SupportChatWorkspace';

export function SupportInboxPage({
  initialConversationId,
  returnContextLabel,
  onReturnToContext,
}: {
  initialConversationId?: string;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
}) {
  return (
    <div className="console-card-page">
      <SupportChatWorkspace
        onReturnToContext={onReturnToContext}
        returnContextLabel={returnContextLabel}
        selectedConversationId={initialConversationId}
      />
    </div>
  );
}
