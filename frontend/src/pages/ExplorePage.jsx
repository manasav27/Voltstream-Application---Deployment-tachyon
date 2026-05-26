import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  FileSearch,
  Home,
  ReceiptText,
  RadioTower,
  Zap,
} from 'lucide-react';

const openGroot = (mode = 'bot') => {
  window.dispatchEvent(new CustomEvent('voltstream-open-groot', { detail: { mode } }));
};

const FeatureIcon = ({ Icon, color = '#168bff' }) => (
  <div
    className="grid h-16 w-16 place-items-center rounded-2xl border bg-white/[0.03]"
    style={{
      borderColor: `${color}66`,
      color,
      boxShadow: `0 0 34px ${color}2e, inset 0 0 18px ${color}14`,
    }}
  >
    <Icon className="h-9 w-9" strokeWidth={1.7} />
  </div>
);

const ActionLink = ({ children, to, color = '#168bff', onClick }) => {
  const className = "inline-flex min-h-[46px] items-center gap-3 rounded-lg border px-5 text-sm font-black transition hover:bg-white/[0.06]";
  const style = { borderColor: `${color}88`, color };

  if (to) {
    return (
      <Link to={to} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {children}
    </button>
  );
};

const FeatureCard = ({ title, description, Icon, color, action, to, onClick }) => (
  <article
    className="explore-feature-card explore-glow-card group flex min-h-[230px] flex-col justify-between rounded-2xl border bg-[#04101e]/70 p-5"
    style={{
      '--glow-color': color,
      '--card-border': `${color}42`,
      '--card-shadow': `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 32px ${color}12`,
    }}
  >
    <FeatureIcon Icon={Icon} color={color} />
    <div>
      <h3 className="mt-6 text-xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      <div className="mt-5 h-px bg-white/8" />
      <ActionLink to={to} onClick={onClick} color={color}>
        {action} <ArrowRight className="h-4 w-4" />
      </ActionLink>
    </div>
  </article>
);

const AssistantBotVisual = () => (
  <div className="relative flex h-full min-h-[250px] items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_40%,rgba(22,139,255,0.22),transparent_38%),linear-gradient(180deg,rgba(5,18,34,0.1),rgba(0,0,0,0.2))]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(22,139,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(22,139,255,0.06)_1px,transparent_1px)] bg-[size:42px_42px] opacity-60" />
    <div className="absolute left-10 top-10 h-16 w-28 rounded-lg border border-[#168bff]/35 bg-[#168bff]/10 shadow-[0_0_24px_rgba(22,139,255,0.22)]">
      <span className="absolute left-4 top-4 h-1 w-16 rounded-full bg-[#168bff]/80" />
      <span className="absolute left-4 top-8 h-1 w-20 rounded-full bg-[#168bff]/45" />
      <span className="absolute left-4 top-12 h-1 w-12 rounded-full bg-[#168bff]/45" />
    </div>
    <div className="absolute right-12 top-8 h-20 w-28 rounded-lg border border-[#168bff]/35 bg-[#168bff]/10 shadow-[0_0_24px_rgba(22,139,255,0.22)]">
      <span className="absolute left-4 top-4 h-1 w-16 rounded-full bg-[#168bff]/80" />
      <span className="absolute left-4 top-8 h-1 w-20 rounded-full bg-[#168bff]/45" />
      <span className="absolute left-4 top-12 h-1 w-12 rounded-full bg-[#168bff]/45" />
    </div>
    <div className="absolute bottom-9 h-12 w-56 rounded-t-xl bg-slate-100 shadow-[0_0_34px_rgba(22,139,255,0.24)]">
      <div className="mx-auto mt-2 grid w-36 grid-cols-8 gap-1">
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={index} className="h-1.5 rounded-sm bg-slate-500/70" />
        ))}
      </div>
    </div>
    <div className="absolute bottom-7 h-3 w-64 rounded-full bg-white/80" />
    <div className="relative mb-10 flex flex-col items-center">
      <span className="h-4 w-4 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.8)]" />
      <span className="h-8 w-1 rounded-full bg-white" />
      <div className="relative h-28 w-28 rounded-[2.4rem] bg-white shadow-[0_0_44px_rgba(22,139,255,0.45),inset_0_-12px_18px_rgba(22,139,255,0.12)]">
        <span className="absolute -left-4 top-11 h-10 w-5 rounded-full bg-sky-200" />
        <span className="absolute -right-4 top-11 h-10 w-5 rounded-full bg-sky-200" />
        <div className="absolute left-5 top-9 h-12 w-[72px] rounded-3xl bg-[#031327] shadow-[inset_0_0_18px_rgba(22,139,255,0.55)]">
          <span className="absolute left-4 top-5 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          <span className="absolute right-4 top-5 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          <span className="absolute bottom-3 left-1/2 h-2 w-5 -translate-x-1/2 rounded-b-full border-b-2 border-cyan-300" />
        </div>
      </div>
      <div className="h-20 w-32 rounded-b-[3rem] rounded-t-[2.2rem] bg-white shadow-[0_0_36px_rgba(22,139,255,0.28),inset_0_-14px_20px_rgba(22,139,255,0.12)]" />
    </div>
  </div>
);

const ExplorePage = () => (
  <div className="h-screen overflow-y-auto bg-[#020711] px-4 py-5 text-white lg:px-6">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_75%_6%,rgba(22,139,255,0.13),transparent_30%),radial-gradient(circle_at_18%_18%,rgba(239,68,68,0.12),transparent_24%),radial-gradient(circle_at_18%_74%,rgba(20,228,157,0.08),transparent_28%)]" />
    <div className="relative z-10 mx-auto w-full max-w-[1540px] space-y-5">
      <section className="explore-glow-card relative overflow-hidden rounded-2xl border border-sky-300/15 bg-[#04101e]/78 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_24px_70px_rgba(0,0,0,0.38)] lg:p-7" style={{ '--glow-color': '#168bff' }}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(22,139,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(22,139,255,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
        <div className="relative grid min-h-[260px] gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ef4444]">Explore VoltStream</p>
            <h1 className="mt-4 max-w-[540px] text-4xl font-black leading-tight text-white md:text-5xl">
              Your energy,<br /> powered by <span className="text-[#ef4444]">AI.</span>
            </h1>
            <p className="mt-4 max-w-[500px] text-base leading-7 text-slate-300">
              Discover tools built to help you monitor, understand and control your energy smarter.
            </p>
            <div className="mt-6">
              <ActionLink to="/live" color="#ef4444">
                <Zap className="h-4 w-4 fill-current" /> Get started
              </ActionLink>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <div className="relative grid h-56 w-56 place-items-center">
              <div className="absolute inset-0 rounded-full border border-[#168bff]/70 bg-[#168bff]/10 shadow-[0_0_80px_rgba(22,139,255,0.36)]" />
              <div className="absolute bottom-6 h-12 w-48 rounded-[50%] border border-[#168bff]/70 bg-[#168bff]/10 shadow-[0_0_38px_rgba(22,139,255,0.44)]" />
              <Zap className="relative h-24 w-24 text-cyan-300 drop-shadow-[0_0_24px_rgba(34,211,238,0.8)]" strokeWidth={1.7} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)]">
        <div className="explore-glow-card min-h-[286px] rounded-2xl border border-[#ef4444]/25 bg-[#04101e]/78 p-3 shadow-[0_0_34px_rgba(239,68,68,0.12)]" style={{ '--glow-color': '#ef4444' }}>
          <AssistantBotVisual />
        </div>
        <div className="explore-glow-card flex min-h-[286px] flex-col justify-center rounded-2xl border border-[#ef4444]/20 bg-[#04101e]/70 p-6" style={{ '--glow-color': '#ef4444' }}>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ef4444]">Featured - AI</p>
          <h2 className="mt-5 text-2xl font-black text-white">Why use our AI Assistant?</h2>
          <p className="mt-4 max-w-[560px] text-base leading-7 text-slate-300">
            Chat naturally with our AI assistant - Groot, for real-time energy insights, smart recommendations, and instant answers all in plain language.
          </p>
          <div className="mt-6">
            <ActionLink color="#ef4444" onClick={() => openGroot('bot')}>
              Open Chat <ArrowRight className="h-4 w-4" />
            </ActionLink>
          </div>
        </div>
      </section>

      <section className="explore-glow-card relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#03160f]/75 p-6 text-center shadow-[0_0_34px_rgba(20,228,157,0.1)]" style={{ '--glow-color': '#14e49d' }}>
        <RadioTower className="mx-auto h-16 w-16 text-[#14e49d] drop-shadow-[0_0_20px_rgba(20,228,157,0.55)]" strokeWidth={1.5} />
        <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-[#14e49d]">Live - Real-time</p>
        <h2 className="mt-4 text-2xl font-black text-white">Smart Live Grid Draw</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-base leading-7 text-slate-300">
          Watch your grid come alive. Monitor import/export, load patterns and power flow as they happen.
        </p>
        <div className="mt-5">
          <ActionLink to="/live" color="#14e49d">
            <BarChart3 className="h-4 w-4" /> View Live Grid
          </ActionLink>
        </div>
      </section>

      <section>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#168bff]">All Features</p>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title="Billing Insights"
            description="Track projected cost, budget usage, invoices and monthly spend."
            Icon={ReceiptText}
            color="#ef4444"
            action="View Billing"
            to="/billing"
          />
          <FeatureCard
            title="RAG Bot"
            description="Chat with your docs and knowledge base for deeper answers."
            Icon={FileSearch}
            color="#8b5cf6"
            action="Search"
            onClick={() => openGroot('rag')}
          />
          <FeatureCard
            title="Smart Devices"
            description="Control your home energy devices with the help of our AI agent - Groot."
            Icon={Home}
            color="#f59e0b"
            action="Manage"
            to="/devices"
          />
        </div>
      </section>

      <style>{`
        .explore-feature-card {
          border-color: var(--card-border);
          box-shadow: var(--card-shadow);
        }

        .explore-glow-card {
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .explore-glow-card:hover {
          border-color: color-mix(in srgb, var(--glow-color) 38%, transparent);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 0 30px color-mix(in srgb, var(--glow-color) 30%, transparent);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  </div>
);

export default ExplorePage;
