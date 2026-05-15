import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw, Zap } from "lucide-react";

export default function Notfound({ isError = false }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-6 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_14%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_18%_78%,rgba(34,197,94,0.10),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(249,115,22,0.08),transparent_34%)]" />

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section className="w-full max-w-3xl rounded-2xl border border-sky-300/15 bg-[#07111f]/90 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-sky-300/25 bg-sky-400/10 text-sky-200 shadow-[0_0_28px_rgba(59,130,246,0.24)]">
            {isError ? <AlertTriangle className="h-8 w-8" /> : <Zap className="h-8 w-8" />}
          </div>

          <p className="mt-7 text-sm font-black uppercase tracking-[0.42em] text-sky-300/80">
            VoltStream
          </p>
          <h2 className="mt-4 text-6xl font-black tracking-tight text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.18)] sm:text-7xl">
            404
          </h2>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {isError ? "Page could not be displayed" : "Page not found"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            {isError
              ? "Something interrupted this screen. You can refresh the app or return to the live dashboard."
              : "The page you are looking for does not exist or may have been moved."}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d6df2] px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(29,109,242,0.34)] transition hover:bg-sky-500"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:border-sky-300/45 hover:bg-sky-300/15"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
