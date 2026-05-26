import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Loader2, Send, Sparkles, X } from 'lucide-react';
import FormattedMessage from './chat/FormattedMessage';

const LOCAL_API_BASE = 'http://127.0.0.1:8000/api/v1';
const DEPLOYED_API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_BASE : DEPLOYED_API_BASE);

export default function PageGrootInsight({ page, data, className = '' }) {
  const [enabled, setEnabled] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentAlert, setAgentAlert] = useState(null);

  useEffect(() => {
    const handleAgentAlert = (event) => {
      if (event.detail?.page && event.detail.page !== page) return;
      setAgentAlert(event.detail);
    };

    window.addEventListener('voltstream-page-insight-alert', handleAgentAlert);
    return () => window.removeEventListener('voltstream-page-insight-alert', handleAgentAlert);
  }, [page]);

  const askGroot = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    setIsLoading(true);
    setAnswer('');

    try {
      const response = await axios.post(`${API_BASE}/page-insight`, {
        page,
        question: trimmedQuestion,
        data,
      });
      setAnswer(response.data?.answer || 'I looked at this page, but could not find a clear insight.');
    } catch (error) {
      setAnswer('I could not inspect this page right now. Please check that the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const alertDevices = agentAlert?.devices || [];
  const visibleAlertDevices = alertDevices.slice(0, 4);
  const hiddenAlertCount = Math.max(alertDevices.length - visibleAlertDevices.length, 0);
  const essentialDevice = alertDevices.find((device) =>
    /refrigerator|fridge/i.test(device.name)
  );
  const alertTitle = agentAlert?.action === 'OFF'
    ? 'Mass shutdown detected'
    : 'Mass startup detected';
  const alertHeadline = agentAlert?.action === 'OFF'
    ? 'All devices turned off - review essentials'
    : 'All devices turned on - watch demand spike';

  return (
    <section className={`rounded-2xl border border-sky-300/15 bg-[#17181c]/90 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.28)] ${className}`}>
      {agentAlert && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-orange-600/80 bg-[#160c08] shadow-[0_0_34px_rgba(234,88,12,0.24)]">
          <div className="flex items-center justify-between gap-3 border-b border-orange-700/45 bg-[#541708]/80 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2 text-orange-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="truncate text-xs font-black uppercase tracking-[0.18em]">{alertTitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setAgentAlert(null)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-orange-200/15 bg-black/15 text-orange-100 transition hover:bg-black/25"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-4">
            <p className="text-lg font-black text-white">{alertHeadline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {essentialDevice && agentAlert.action === 'OFF' && (
                <span className="rounded-full border border-emerald-400 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-300">
                  {essentialDevice.name} / keep on
                </span>
              )}
              {visibleAlertDevices.map((device) => (
                <span
                  key={device.id || device.name}
                  className="rounded-full border border-orange-100/25 bg-black/20 px-3 py-1.5 text-sm font-semibold text-orange-100"
                >
                  {device.name}
                </span>
              ))}
              {hiddenAlertCount > 0 && (
                <span className="rounded-full border border-orange-100/25 bg-black/20 px-3 py-1.5 text-sm font-semibold text-orange-100">
                  +{hiddenAlertCount} more
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {agentAlert.action === 'OFF' && essentialDevice && (
                <button
                  type="button"
                  onClick={() => {
                    setEnabled(true);
                    setQuestion(`Should I keep ${essentialDevice.name} on after this shutdown?`);
                  }}
                  className="rounded-xl border border-emerald-400/60 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-400/15"
                >
                  Keep essential on
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEnabled(true);
                  setQuestion(`Review this ${agentAlert.action === 'OFF' ? 'shutdown' : 'startup'} and suggest what to manage next.`);
                }}
                className="rounded-xl border border-orange-200/20 bg-orange-500/10 px-4 py-2 text-sm font-black text-orange-100 transition hover:bg-orange-500/15"
              >
                Manage all
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-sky-300/25 bg-sky-300/10 text-sky-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Want Groot to look into this page?</p>
            <p className="text-xs text-slate-400">Ask what is happening here and get page-specific suggestions.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEnabled(true)}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${enabled === true ? 'bg-sky-400 text-slate-950' : 'border border-sky-300/20 bg-sky-300/10 text-sky-200 hover:bg-sky-300/15'}`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => {
              setEnabled(false);
              setAnswer('');
              setQuestion('');
             }}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${enabled === false ? 'bg-white text-slate-950' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            No
          </button>
        </div>
      </div>

      {enabled && (
        <form onSubmit={askGroot} className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-2">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask Groot to inspect this page..."
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-400 text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Ask Groot"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}

      {answer && (
        <div className="page-groot-answer mt-4 rounded-2xl border border-sky-300/15 bg-black/45 p-4 text-sm leading-relaxed text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <FormattedMessage text={answer} isUser={false} />
        </div>
      )}
    </section>
  );
}
