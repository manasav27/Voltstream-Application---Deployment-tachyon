import FormattedMessage from './FormattedMessage';

const BotAvatar = () => (
  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sky-300/20 bg-sky-300/10 shadow-[0_0_18px_rgba(56,189,248,0.18)]">
    <span className="groot-logo scale-[0.72]" aria-hidden="true">
      <span className="groot-logo__antenna" />
      <span className="groot-logo__ear groot-logo__ear--left" />
      <span className="groot-logo__ear groot-logo__ear--right" />
      <span className="groot-logo__face">
        <span className="groot-logo__eye groot-logo__eye--left" />
        <span className="groot-logo__eye groot-logo__eye--right" />
      </span>
      <span className="groot-logo__tail" />
    </span>
  </div>
);

export default function MessageList({
  messages,
  isSending,
  messagesEndRef,
  maximized = false,
}) {
  return (
    <div className={`${maximized ? 'min-h-0 flex-1 space-y-3 overflow-y-auto px-7 py-6' : 'max-h-[340px] min-h-[240px] space-y-3 overflow-y-auto px-4 py-4'}`}>
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role !== 'user' && <BotAvatar />}
          <div
            className={`${maximized ? 'max-w-[78%]' : 'max-w-[84%]'} rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'rounded-br-md bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.22)]'
                : 'rounded-bl-md border border-sky-300/15 bg-[#0b1728]/92 text-slate-100 shadow-[0_14px_34px_rgba(14,165,233,0.10)]'
            }`}
          >
            <FormattedMessage text={message.text} isUser={message.role === 'user'} />
          </div>
        </div>
      ))}

      {isSending && (
        <div className="flex items-start justify-start gap-3">
          <BotAvatar />
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-sky-300/15 bg-[#0b1728]/92 px-4 py-3 text-sm text-slate-200">
            <span className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300 [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300 [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300" />
            </span>
            Thinking
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
