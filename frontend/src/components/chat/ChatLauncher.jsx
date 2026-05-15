export default function ChatLauncher({
  isOpen,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  onPromptClick,
}) {
  return (
    <div className="group flex items-center">
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
        className="groot-orb relative grid h-16 w-16 shrink-0 touch-none place-items-center overflow-visible rounded-full transition duration-300 hover:scale-105"
        aria-label={isOpen ? 'Close Groot chat' : 'Meet Groot'}
      >
        <span className="groot-logo">
          <span className="groot-logo__antenna" />
          <span className="groot-logo__ear groot-logo__ear--left" />
          <span className="groot-logo__ear groot-logo__ear--right" />
          <span className="groot-logo__face">
            <span className="groot-logo__eye groot-logo__eye--left" />
            <span className="groot-logo__eye groot-logo__eye--right" />
          </span>
          <span className="groot-logo__tail" />
        </span>
      </button>

      <button
        type="button"
        onClick={onPromptClick}
        className="ml-3 translate-x-[-10px] scale-95 rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 opacity-0 shadow-[0_14px_34px_rgba(0,0,0,0.25)] transition duration-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100"
        aria-label="Open Groot assistant"
      >
        I'm groot, how can I help you?
      </button>
    </div>
  );
}
