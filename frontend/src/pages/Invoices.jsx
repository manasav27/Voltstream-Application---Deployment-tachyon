import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  Refrigerator,
  Users,
  Zap,
} from 'lucide-react';
import PageGrootInsight from '../components/PageGrootInsight';

const LOCAL_API_BASE = 'http://127.0.0.1:8000/api/v1';
const DEPLOYED_API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_BASE : DEPLOYED_API_BASE);
const USD_TO_INR = 83.85;
const formatINR = (amount) => new Intl.NumberFormat('en-IN', { //converts to proper INR format with currency symbol and no decimal places
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount * USD_TO_INR);

const invoices = [
  { month: 'April 2026', amount: 142.50, status: 'Paid' },
  { month: 'March 2026', amount: 158.20, status: 'Paid' },
  { month: 'February 2026', amount: 180.00, status: 'Paid' },
];

const Panel = ({ children, className = '' }) => ( // the dark glass-like card container.
  <div className={`rounded-2xl border border-white/10 bg-[#17181c] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

const CommunityGauge = ({ yourSpend = 64, communitySpend = 78 }) => (  //the semi-circle gauge inside Community Benchmarking.
  <div className="relative mx-auto h-24 w-40 overflow-hidden">
    <svg viewBox="0 0 210 132" className="h-full w-full">
      <path d="M28 112 A77 77 0 0 1 182 112" fill="none" stroke="#202534" strokeWidth="14" />
      <path d="M45 112 A60 60 0 0 1 165 112" fill="none" stroke="#252a38" strokeWidth="14" />
      <path d="M62 112 A43 43 0 0 1 148 112" fill="none" stroke="#303542" strokeWidth="14" />
      <path
        d="M28 112 A77 77 0 0 1 182 112"
        fill="none"
        pathLength="100"
        stroke="#38bdf8"
        strokeDasharray={`${yourSpend} 100`}
        strokeWidth="14"
      />
      <path
        d="M45 112 A60 60 0 0 1 165 112"
        fill="none"
        pathLength="100"
        stroke="#22c55e"
        strokeDasharray={`${communitySpend} 100`}
        strokeWidth="14"
      />
      <path d="M62 112 A43 43 0 0 1 132 78" fill="none" stroke="#ddd6fe" strokeWidth="14" strokeLinecap="butt" />
      <line
        x1="105"
        y1="112"
        x2={105 + Math.cos(Math.PI - (Math.PI * yourSpend) / 100) * 76}
        y2={112 - Math.sin(Math.PI - (Math.PI * yourSpend) / 100) * 76}
        stroke="#ede9fe"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
    <div className="absolute bottom-0 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-primary/30 bg-[#101923] shadow-[0_0_25px_rgba(56,189,248,0.25)]">
      <Users className="h-4 w-4 text-sky-300" />
    </div>
  </div>
);

const Invoices = () => {
  const [data, setData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billingRes, devicesRes] = await Promise.all([
          axios.get(`${API_BASE}/billing/summary`),
          axios.get(`${API_BASE}/devices`),
        ]);

        setData(billingRes.data);
        setDevices(Array.isArray(devicesRes.data) ? devicesRes.data : []);
      } catch (error) {
        console.error('Error fetching billing summary', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const billingMetrics = useMemo(() => {
    const baseBilling = data || {
      current_month_cost: 0,
      projected_cost: 0,
      budget_limit: 50000,
    };
    const activeDevices = devices.filter((device) => device.status === 'ON');
    const activeWatts = activeDevices.reduce((total, device) => total + (Number(device.power_draw_w) || 0), 0);
    const activeKw = activeWatts / 1000;
    const monthlyKwh = activeKw * 7.5 * 30;
    const monthlyDeviceCost = monthlyKwh * 0.18;
    const dailyDeviceCost = activeKw * 7.5 * 0.18;
    const solarOffset = Math.min(28, 10 + activeKw * 3.2);
    const projectedCost = baseBilling.projected_cost + monthlyDeviceCost - solarOffset;
    const currentCost = baseBilling.current_month_cost + dailyDeviceCost;
    const adaptiveBudgetLimit = Math.max(65, baseBilling.budget_limit - activeKw * 4);
    const communityAverage = 116;
    const savingsVsCommunity = Math.round(((communityAverage - projectedCost) / communityAverage) * 100);

    return {
      activeDevices,
      activeKw,
      currentCost,
      projectedCost,
      budgetLimit: adaptiveBudgetLimit,
      communityAverage,
      communitySpendPercent: Math.min(96, (communityAverage / 130) * 100),
      dailyDeviceCost,
      monthlyDeviceCost,
      savingsVsCommunity,
      solarOffset,
      yourSpendPercent: Math.min(96, (projectedCost / 130) * 100),
    };
  }, [data, devices]);

  const budgetPercent = Math.min((billingMetrics.projectedCost / billingMetrics.budgetLimit) * 100, 100);
  const budgetDifference = billingMetrics.projectedCost - billingMetrics.budgetLimit;
  const isOverBudget = budgetDifference > 0;
  const isBudgetWarning = budgetPercent >= 80;
  const lastMonthDelta = ((billingMetrics.projectedCost - 90) / 90) * 100;

  if (loading || !data) {  
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-black text-white [direction:rtl] scrollbar-thin scrollbar-track-black scrollbar-thumb-primary/60">
      <div className="min-h-full [direction:ltr]">
        <div className="relative mx-auto w-full max-w-[1240px] px-5 py-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-sky-300/25 to-transparent" />
            <div className="absolute right-8 top-8 h-40 w-44 rounded-full bg-primary/10 blur-[70px]" />
          </div>

          <div className="relative z-10 space-y-5">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.16)] lg:text-4xl">
                  Billing & Invoices
                </h2>
                <p className="mt-2 text-sm text-slate-400">Monitor your energy costs and budget status.</p>
              </div>
              <Panel className="w-full max-w-[180px] px-5 py-4 text-right shadow-[0_0_45px_rgba(56,189,248,0.24)] sm:rounded-2xl">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Current Balance</p>
                <p className="mt-2 text-3xl font-black text-white">{formatINR(billingMetrics.currentCost)}</p>
              </Panel>
            </header>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel className="min-h-[180px] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Projected Monthly Bill</p>
                    <p className="mt-4 text-5xl font-black tracking-tight text-white">{formatINR(billingMetrics.projectedCost)}</p>
                    <p className="mt-3 text-sm text-slate-400">
                      {billingMetrics.activeDevices.length} devices on, drawing {billingMetrics.activeKw.toFixed(2)} kW right now.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-500/40 bg-slate-950/45 px-4 py-3 text-sm">
                    <p className="font-black text-white">
                      vs. Last Month: <span className={lastMonthDelta <= 0 ? 'text-primary' : 'text-accent'}>{lastMonthDelta.toFixed(0)}%</span>
                    </p>
                    <p className="mt-1 text-white">{formatINR(billingMetrics.monthlyDeviceCost)} device load</p>
                  </div>
                </div>
                <div className="mt-6 h-1.5 rounded-full bg-[#2b2d33]">
                  <div className="h-full w-3/4 rounded-full bg-[#3b82f6] shadow-[0_0_18px_rgba(59,130,246,0.42)]" />
                </div>
              </Panel>

              <Panel className={`min-h-[180px] p-6 ${isBudgetWarning ? 'border-accent/70 shadow-[0_0_55px_rgba(249,115,22,0.28)]' : ''}`}>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Budget Utilization</p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <p className="text-5xl font-black tracking-tight text-white">{budgetPercent.toFixed(0)}%</p>
                  {isBudgetWarning && (
                    <div className="flex max-w-sm items-center gap-3 rounded-lg border border-[#ff4d45]/70 bg-[#ff4d45]/10 px-4 py-3 text-[#ff4d45]">
                      <AlertTriangle className="h-6 w-6 shrink-0" />
                      <p className="text-xl font-black uppercase">Overlimit Alert!</p>
                    </div>
                  )}
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={isBudgetWarning
                      ? 'h-full rounded-full bg-[#ff4d45] shadow-[0_0_18px_rgba(255,77,69,0.42)]'
                      : 'h-full rounded-full bg-[#22c55e] shadow-[0_0_18px_rgba(34,197,94,0.42)]'}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-400">
                  {isOverBudget
                    ? `Projected bill is ${formatINR(budgetDifference)} above your adaptive ${formatINR(billingMetrics.budgetLimit)} budget.`
                    : `Budget status: ${formatINR(billingMetrics.budgetLimit - billingMetrics.projectedCost)} remaining before the adaptive ${formatINR(billingMetrics.budgetLimit)} limit.`}
                </p>
              </Panel>
            </section>

            <section>
              <h3 className="mb-2 text-lg font-black text-sky-200 drop-shadow-[0_0_12px_rgba(56,189,248,0.25)]">Smart Features</h3>
              <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 md:grid-cols-2">
                <Panel className="min-h-[238px] p-3.5">
                  <h4 className="text-sm font-black leading-tight text-white">Appliance Health & Maintenance Predictor</h4>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 p-2.5 text-center">
                      <Zap className="mx-auto h-6 w-6 text-[#8b5cf6]" />
                      <p className="mt-1.5 text-xs font-semibold text-white">HVAC</p>
                      <p className="text-xs text-[#6ee75a]">healthy</p>
                    </div>
                    <div className="rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/10 p-2.5 text-center">
                      <Refrigerator className="mx-auto h-6 w-6 text-[#3b82f6]" />
                      <p className="mt-1.5 text-xs font-semibold text-white">Fridge</p>
                      <p className="text-xs text-[#ff4d45]">check-up needed</p>
                    </div>
                  </div>
                  <div className="mt-2.5 rounded-xl border border-primary/20 bg-black/20 p-2.5">
                    <p className="text-xs text-white">Maintenance Alert</p>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-3 text-slate-300"><span>Upcoming service</span><span className="text-sky-300">5/5/2023</span></div>
                      <div className="flex justify-between gap-3 text-slate-300"><span>Filter replacement alerts</span><span className="text-orange-300">10+ days</span></div>
                    </div>
                    <button className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-sky-300">
                      <CalendarClock className="h-4 w-4" />
                      Schedule Service
                    </button>
                  </div>
                </Panel>

                <Panel className="min-h-[238px] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black leading-tight text-white">Community Benchmarking</h4>
                      <p className="mt-2 text-xs text-slate-400">Community Average for similar users</p>
                    </div>
                    <div className="rounded-lg border border-[#ec4899]/25 bg-[#ec4899]/10 p-2 text-[#ec4899]">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <CommunityGauge
                    yourSpend={billingMetrics.yourSpendPercent}
                    communitySpend={billingMetrics.communitySpendPercent}
                  />
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-[#ec4899]" />Your spend</span>
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-[#f97316]" />Community Average</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-[#6ee75a]/20 bg-[#6ee75a]/10 px-3 py-1.5 text-xs text-[#6ee75a]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      {billingMetrics.savingsVsCommunity >= 0
                        ? `You are saving ${billingMetrics.savingsVsCommunity}% vs. community average!`
                        : `You are ${Math.abs(billingMetrics.savingsVsCommunity)}% above community average.`}
                    </span>
                  </div>
                </Panel>
              </div>
            </section>

            <section className="pb-8">
              <Panel className="overflow-hidden">
                <div className="border-b border-primary/10 px-5 py-4">
                  <h3 className="text-lg font-black text-sky-100">Recent Invoices</h3>
                </div>
                <div className="divide-y divide-slate-800/70">
                  {invoices.map((inv, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-primary/5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="rounded-xl border p-3"
                          style={{
                            borderColor: ['#f97316', '#3b82f6', '#ec4899'][idx % 3],
                            backgroundColor: `${['#f97316', '#3b82f6', '#ec4899'][idx % 3]}22`,
                          }}
                        >
                          <IndianRupee
                            className="h-5 w-5"
                            style={{ color: ['#f97316', '#3b82f6', '#ec4899'][idx % 3] }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{inv.month}</p>
                          <p
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: ['#6ee75a', '#60a5fa', '#f472b6'][idx % 3] }}
                          >
                            {inv.status}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-lg font-black text-white">{formatINR(inv.amount)}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <PageGrootInsight
              page="Billing and Invoices"
              data={{
                billingSummary: data,
                billingMetrics,
                budgetPercent,
                isOverBudget,
                invoices,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
