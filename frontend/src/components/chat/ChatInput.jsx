import { Send, Square } from 'lucide-react';

export default function ChatInput({
  inputRef,
  question,
  setQuestion,
  onSubmit,
  isSending,
  isRagBot,
  onStop,
  compact = false,
}) {
  const input = (
    <input
      ref={inputRef}
      value={question}
      onChange={(event) => setQuestion(event.target.value)}
      placeholder={isRagBot ? 'Ask from the energy PDFs...' : 'Ask anything...'}
      className={
        compact
          ? 'min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500'
          : 'min-w-0 flex-1 rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/70 focus:bg-white/10'
      }
    />
  );

  const button = isSending ? (
    <button
      type="button"
      onClick={onStop}
      className={`${compact ? 'h-12 w-12' : 'h-11 w-11'} grid shrink-0 place-items-center rounded-full bg-rose-500 text-white shadow-[0_0_22px_rgba(244,63,94,0.38)] transition hover:bg-rose-400`}
      aria-label="Stop response"
    >
      <Square className="h-4 w-4 fill-current" />
    </button>
  ) : (
    <button
      type="submit"
      disabled={!question.trim()}
      className={`${compact ? 'h-12 w-12' : 'h-11 w-11'} grid shrink-0 place-items-center rounded-full bg-sky-400 text-black shadow-[0_0_22px_rgba(56,189,248,0.45)] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-45`}
      aria-label="Send message"
    >
      <Send className="h-4 w-4" />
    </button>
  );

  if (compact) {
    return (
      <form onSubmit={onSubmit} className="mt-10 flex w-full max-w-3xl items-center gap-3 rounded-3xl border border-sky-300/25 bg-white/8 p-3 shadow-[0_0_36px_rgba(56,189,248,0.10)]">
        {input}
        {button}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-white/10 bg-black/25 p-3">
      {input}
      {button}
    </form>
  );
}
