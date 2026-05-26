import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const titleLines = [
  { text: 'POWER', color: 'text-white' },
  { text: 'THE', color: 'text-[#168bff]' },
  { text: 'GRID', color: 'text-white' },
];

const letterVariants = {
  hidden: { opacity: 0, y: 72, rotateX: -24 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: 0.34 + index * 0.045,
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const riseVariants = {
  hidden: { opacity: 0, y: 34 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  }),
};

const AnimatedTitle = () => {
  let letterIndex = 0;

  return (
    <h1 className="intro-glass-title mt-4 max-w-[500px] text-[clamp(3.2rem,6.6vw,5.8rem)] font-black uppercase leading-[0.84] tracking-normal drop-shadow-[0_0_20px_rgba(59,130,246,0.16)]">
      {titleLines.map((line) => (
        <span key={line.text} className={`block ${line.color}`}>
          {line.text.split('').map((letter) => {
            const currentIndex = letterIndex;
            letterIndex += 1;
            return (
              <motion.span
                key={`${line.text}-${currentIndex}`}
                custom={currentIndex}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                className="inline-block"
              >
                {letter}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
};

const VoltStreamMark = () => (
  <svg
    className="h-14 w-14 shrink-0 drop-shadow-[0_0_18px_rgba(239,68,68,0.55)]"
    viewBox="0 0 96 96"
    role="img"
    aria-label="VoltStream lightning logo"
  >
    <circle
      cx="48"
      cy="48"
      r="38"
      fill="none"
      stroke="#ef1d2f"
      strokeWidth="7"
      strokeDasharray="162 80"
      strokeLinecap="round"
      transform="rotate(-42 48 48)"
    />
    <circle
      cx="48"
      cy="48"
      r="38"
      fill="none"
      stroke="#171113"
      strokeWidth="7"
      strokeDasharray="132 110"
      strokeLinecap="round"
      transform="rotate(137 48 48)"
    />
    <path d="M58 5 24 52h21L35 91l38-51H52L58 5Z" fill="#171113" />
    <path d="M63 7 33 45h24L43 89l31-48H55L63 7Z" fill="#ef1d2f" />
  </svg>
);

const IntroPage = () => {
  return (
  <div className="h-screen overflow-hidden bg-[#020711] px-5 py-4 text-white sm:px-8 lg:px-12">
    <div className="mx-auto flex h-full max-w-[1500px] items-center">
      <section className="relative h-full w-full overflow-hidden px-4 py-4 sm:px-8 lg:px-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_11%_8%,rgba(239,29,47,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(22,139,255,0.18),transparent_30%),radial-gradient(circle_at_58%_74%,rgba(34,197,94,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/50 to-transparent" />
        <div className="relative z-10 flex h-full max-w-[620px] flex-col">
          <div>
            <motion.div
              variants={riseVariants}
              initial="hidden"
              animate="visible"
              custom={0.12}
              className="flex items-center gap-4"
            >
              <VoltStreamMark />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#168bff]">Live Energy Intelligence</p>
                <p className="text-lg font-black uppercase tracking-wide text-white">
                  Volt<span className="text-[#168bff]">Stream</span>
                </p>
              </div>
            </motion.div>

            <AnimatedTitle />

            <motion.p
              variants={riseVariants}
              initial="hidden"
              animate="visible"
              custom={1.18}
              className="mt-5 max-w-[420px] text-base leading-7 text-slate-300"
            >
              Monitor solar generation, control smart devices and track your carbon footprint live.
            </motion.p>

            <motion.div
              variants={riseVariants}
              initial="hidden"
              animate="visible"
              custom={1.36}
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/live"
                className="glitch-reveal-button flex min-h-[54px] min-w-[220px] items-center justify-center gap-3 rounded-lg border border-[#168bff]/45 bg-black px-7 text-sm font-black uppercase tracking-wide text-[#168bff] shadow-[0_0_22px_rgba(22,139,255,0.18)] transition"
              >
                <Zap className="h-5 w-5 fill-white" /> Get Started
              </Link>
              <Link
                to="/explore"
                className="glitch-reveal-button glitch-reveal-button--green flex min-h-[54px] min-w-[210px] items-center justify-center gap-2 rounded-lg border border-emerald-300/30 bg-black px-7 text-sm font-black uppercase tracking-wide text-emerald-300 shadow-[0_0_22px_rgba(34,197,94,0.14)] transition"
              >
                Explore <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>

          </div>

          <motion.div
            variants={riseVariants}
            initial="hidden"
            animate="visible"
            custom={1.58}
            className="mt-auto grid max-w-[700px] grid-cols-3 gap-3 pt-5"
          >
            <div className="flex min-h-[78px] items-center gap-3 rounded-2xl border border-red-300/20 bg-white/[0.03] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(239,68,68,0.12)]">
              <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-[#ef4444]/70 bg-[#ef4444]/10 text-[#ef4444] shadow-[0_0_22px_rgba(239,68,68,0.45)] sm:grid">
                <Zap className="h-5 w-5" />
              </span>
              <div>
              <p className="text-xl font-black text-white sm:text-2xl">5.02<span className="text-sm text-[#ef4444] sm:text-base"> kW</span></p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 sm:text-[10px]">Solar Gen</p>
              </div>
            </div>
            <div className="flex min-h-[78px] items-center gap-3 rounded-2xl border border-emerald-300/20 bg-white/[0.03] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(20,228,157,0.12)]">
              <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-[#14e49d]/70 bg-[#14e49d]/10 text-[#14e49d] shadow-[0_0_22px_rgba(20,228,157,0.45)] sm:grid">
                <Zap className="h-5 w-5" />
              </span>
              <div>
              <p className="text-xl font-black text-white sm:text-2xl">3.4<span className="text-sm text-[#14e49d] sm:text-base"> kg</span></p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 sm:text-[10px]">CO2 Saved</p>
              </div>
            </div>
            <div className="flex min-h-[78px] items-center gap-3 rounded-2xl border border-violet-300/20 bg-white/[0.03] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(112,87,255,0.14)]">
              <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-[#7057ff]/70 bg-[#7057ff]/10 text-[#7057ff] shadow-[0_0_22px_rgba(112,87,255,0.45)] sm:grid">
                <Zap className="h-5 w-5" />
              </span>
              <div>
              <p className="text-xl font-black text-white sm:text-2xl">100<span className="text-sm text-[#14e49d] sm:text-base"> %</span></p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 sm:text-[10px]">Solar Goal</p>
              </div>
            </div>
          </motion.div>
        </div>

      </section>
    </div>
    <style>{`
      .glitch-reveal-button {
        position: relative;
        overflow: hidden;
        isolation: isolate;
      }

      .intro-glass-title {
        position: relative;
        filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.34));
      }

      .intro-glass-title span {
        position: relative;
        overflow: hidden;
        text-shadow:
          0 1px 0 rgba(255, 255, 255, 0.2),
          0 0 18px rgba(22, 139, 255, 0.16);
      }

      .intro-glass-title span::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(110deg, transparent 8%, rgba(255,255,255,0.34) 18%, transparent 30%);
        transform: translateX(-120%) skewX(-18deg);
        animation: titleGlassSweep 4.2s ease-in-out infinite;
        pointer-events: none;
      }

      .glitch-reveal-button::before,
      .glitch-reveal-button::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        opacity: 0;
        transition: opacity 160ms ease;
      }

      .glitch-reveal-button::before {
        background:
          repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 5px),
          linear-gradient(90deg, rgba(22,139,255,0.24), rgba(239,68,68,0.18), rgba(22,139,255,0.24));
      }

      .glitch-reveal-button--green::before {
        background:
          repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 5px),
          linear-gradient(90deg, rgba(34,197,94,0.2), rgba(22,139,255,0.18), rgba(34,197,94,0.22));
      }

      .glitch-reveal-button::after {
        left: -12%;
        right: -12%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transform: skewX(-18deg) translateX(-120%);
      }

      .glitch-reveal-button:hover {
        color: #ffffff;
        border-color: rgba(255,255,255,0.58);
        text-shadow: 2px 0 rgba(239,68,68,0.6), -2px 0 rgba(22,139,255,0.62);
        box-shadow: 0 0 30px rgba(22,139,255,0.24), inset 0 0 24px rgba(255,255,255,0.08);
        animation: introButtonGlitch 520ms steps(2, end) infinite;
      }

      .glitch-reveal-button:hover::before,
      .glitch-reveal-button:hover::after {
        opacity: 1;
      }

      .glitch-reveal-button:hover::after {
        transform: skewX(-18deg) translateX(120%);
        transition: transform 540ms ease;
      }

      @keyframes introButtonGlitch {
        0%, 100% { transform: translate(0, 0); }
        25% { transform: translate(1px, -1px); }
        50% { transform: translate(-1px, 1px); }
        75% { transform: translate(1px, 1px); }
      }

      @keyframes titleGlassSweep {
        0%, 38% { transform: translateX(-120%) skewX(-18deg); }
        62%, 100% { transform: translateX(120%) skewX(-18deg); }
      }
    `}</style>
  </div>
  );
};

export default IntroPage;
