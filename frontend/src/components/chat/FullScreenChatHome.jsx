import ChatInput from './ChatInput';
import { suggestionQuestions } from './chatConstants';

export default function FullScreenChatHome({
  historyQuestions,
  question,
  setQuestion,
  onSubmit,
  onAskQuestion,
  isSending,
  isRagBot,
  inputRef,
  onStop,
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-8 py-8 text-center">
      <p className="text-sm font-black uppercase tracking-[0.28em] text-lime-200">
        {isRagBot ? 'VoltStream Energy Guide' : 'Groot'}
      </p>
      <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
        {isRagBot ? 'Welcome to VoltStream Energy Guide' : 'Welcome to Groot, Your AI Assistant'}
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
        {isRagBot
          ? 'Ask questions from the loaded energy PDFs and guides.'
          : 'Ask anything, from quick facts and explanations to coding, planning, writing, and ideas.'}
      </p>

      <ChatInput
        compact
        inputRef={inputRef}
        question={question}
        setQuestion={setQuestion}
        onSubmit={onSubmit}
        isSending={isSending}
        isRagBot={isRagBot}
        onStop={onStop}
      />

      {!isRagBot && (
      <div className="mt-7 grid w-full max-w-3xl grid-cols-3 gap-3">
        {suggestionQuestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onAskQuestion(item)}
            className="min-h-[94px] rounded-2xl border border-white/10 bg-white/6 p-4 text-left text-sm font-semibold leading-5 text-slate-200 transition hover:border-sky-300/45 hover:bg-sky-400/10 hover:text-white"
          >
            {item}
          </button>
        ))}
      </div>
      )}

      {historyQuestions.length > 0 && (
        <p className="mt-5 text-xs text-slate-500">
          Your suggestions disappear after a question, and recent questions stay in the sidebar.
        </p>
      )}
    </div>
  );
}
