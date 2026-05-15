import { useMemo, useState } from 'react';
import { BookOpenText, Bot, Maximize2, Minimize2, Search, X } from 'lucide-react';
import ChatInput from './ChatInput';
import FullScreenChatHome from './FullScreenChatHome';
import MessageList from './MessageList';
import { suggestionQuestions } from './chatConstants';

export default function ChatPanel({
  isMaximized,
  setIsMaximized,
  isRagBot,
  setActiveBot,
  setQuestion,
  setIsOpen,
  messages,
  hasUserMessages,
  historyQuestions,
  question,
  inputRef,
  messagesEndRef,
  isSending,
  onSubmit,
  onAskQuestion,
  onStop,
}) {
  const [historySearch, setHistorySearch] = useState('');
  const filteredHistoryQuestions = useMemo(
    () => historyQuestions.filter((item) => item.toLowerCase().includes(historySearch.trim().toLowerCase())),
    [historyQuestions, historySearch]
  );

  const showRecommendations = !isRagBot && isMaximized;

  return (
    <section
      className={`overflow-hidden border border-white/15 bg-[#101114]/95 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45),0_0_34px_rgba(56,189,248,0.16)] backdrop-blur-2xl ${
        isMaximized
          ? 'fixed inset-3 flex flex-col rounded-2xl sm:inset-5'
          : 'absolute bottom-[96px] left-0 w-[min(360px,calc(100vw-48px))] rounded-2xl'
      }`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-200">
            {isRagBot ? 'RAG Q&A' : 'Groot'}
          </p>
          <p className="text-xs text-slate-400">
            {isRagBot ? 'PDF-grounded energy guide' : 'Your AI assistant'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveBot((current) => (current === 'rag' ? 'bot' : 'rag'));
              setQuestion('');
            }}
            className="flex h-9 items-center gap-2 rounded-lg border border-sky-300/30 px-3 text-xs font-bold uppercase tracking-[0.12em] text-sky-100 transition hover:bg-sky-400/15 hover:text-white"
            aria-label={isRagBot ? 'Open normal bot' : 'Open RAG Q and A'}
          >
            {isRagBot ? <Bot className="h-4 w-4" /> : <BookOpenText className="h-4 w-4" />}
            <span>{isRagBot ? 'BOT' : 'Open RAG Q&A'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMaximized((current) => !current)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label={isMaximized ? 'Restore chat size' : 'Maximize chat'}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {isMaximized ? (
        <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] overflow-hidden">
          <aside className="border-r border-white/10 bg-black/20 px-5 py-5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">History Questions</h3>
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-400 focus-within:border-sky-300/45">
              <Search className="h-4 w-4" />
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search history..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <div className="mt-5 space-y-2">
              {filteredHistoryQuestions.length > 0 ? (
                filteredHistoryQuestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuestion(item)}
                    className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
                    title={item}
                  >
                    {item}
                  </button>
                ))
              ) : (
                <p className="text-sm leading-relaxed text-slate-500">Your searched questions will appear here.</p>
              )}
            </div>
          </aside>

          <main className="flex min-h-0 flex-col bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.10),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.22),rgba(0,0,0,0.08))]">
            {!hasUserMessages && !isSending ? (
              <FullScreenChatHome
                historyQuestions={historyQuestions}
                question={question}
                setQuestion={setQuestion}
                onSubmit={onSubmit}
                onAskQuestion={onAskQuestion}
                isSending={isSending}
                isRagBot={isRagBot}
                inputRef={inputRef}
                onStop={onStop}
              />
            ) : (
              <>
                {showRecommendations && (
                  <div className="border-b border-white/10 px-7 py-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {suggestionQuestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onAskQuestion(item)}
                          className="rounded-xl border border-sky-300/20 bg-sky-400/8 px-4 py-3 text-left text-sm font-semibold text-sky-100 transition hover:border-sky-300/45 hover:bg-sky-400/15"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <MessageList
                  maximized
                  messages={messages}
                  isSending={isSending}
                  messagesEndRef={messagesEndRef}
                />
                <ChatInput
                  inputRef={inputRef}
                  question={question}
                  setQuestion={setQuestion}
                  onSubmit={onSubmit}
                  isSending={isSending}
                  isRagBot={isRagBot}
                  onStop={onStop}
                />
              </>
            )}
          </main>
        </div>
      ) : (
        <>
          <MessageList messages={messages} isSending={isSending} messagesEndRef={messagesEndRef} />
          <ChatInput
            inputRef={inputRef}
            question={question}
            setQuestion={setQuestion}
            onSubmit={onSubmit}
            isSending={isSending}
            isRagBot={isRagBot}
            onStop={onStop}
          />
        </>
      )}
    </section>
  );
}
