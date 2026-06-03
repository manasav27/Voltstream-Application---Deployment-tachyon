import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, Bot, Send } from 'lucide-react';
import PageGrootInsight from '../components/PageGrootInsight';
import FormattedMessage from '../components/chat/FormattedMessage';

const LOCAL_API_BASE = 'http://127.0.0.1:8000/api/v1';
const DEPLOYED_API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_BASE : DEPLOYED_API_BASE);
const analyticsColors = {
  card: '#07111f',
  cardSoft: '#0b1728',
  purple: '#8b5cf6',
  pink: '#3b82f6',
  red: '#ff4d45',
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  usage: '#f97316',
  solar: '#8b5cf6',
  prediction: '#f97316',
  gauge: '#3b82f6',
  heatLow: '#2b2d33',
  heatMid: '#3b82f6',
  heatHigh: '#ec4899',
  categoryA: '#8b5cf6',
  categoryB: '#3b82f6',
  categoryC: '#ff4d45',
  categoryD: '#22c55e',
};

const categoryColors = {
  Heating: analyticsColors.categoryA,
  Kitchen: analyticsColors.categoryB,
  Entertainment: analyticsColors.categoryC,
  Citizen: analyticsColors.categoryD,
  Others: '#94a3b8',
};

const getDeviceCategory = (device) => {
  const name = `${device.name || ''} ${device.type || ''}`.toLowerCase();
  if (name.includes('ac') || name.includes('hvac') || name.includes('heater')) return 'Heating';
  if (name.includes('kitchen') || name.includes('refrigerator') || name.includes('dishwasher') || name.includes('oven') || name.includes('coffee')) return 'Kitchen';
  if (name.includes('tv') || name.includes('entertainment')) return 'Entertainment';
  if (name.includes('lamp') || name.includes('light') || name.includes('fan')) return 'Citizen';
  return 'Others';
};

const buildLiveCategoryData = (devices) => {
  const totals = Object.keys(categoryColors).reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});

  devices
    .filter((device) => device.status === 'ON')
    .forEach((device) => {
      const category = getDeviceCategory(device);
      totals[category] += Number(device.power_draw_w) || 0;
    });

  const totalWatts = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const categories = Object.entries(totals).map(([name, watts]) => ({
    name,
    value: watts / 1000,
    percent: totalWatts ? (watts / totalWatts) * 100 : 0,
    color: categoryColors[name],
  }));

  return {
    totalKw: totalWatts / 1000,
    categories: [...categories].sort((a, b) => b.value - a.value),
    peakCategories: [...categories].sort((a, b) => b.value - a.value),
  };
};

const DonutBreakdown = ({ categories, totalKw }) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg className="-rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1f2937" strokeWidth="18" />
        {categories.filter((category) => category.value > 0).map((category) => {
          const dash = (category.percent / 100) * circumference;
          const circle = (
            <circle
              key={category.name}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={category.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-2xl font-black text-white">{totalKw.toFixed(2)}</p>
        <p className="text-xs font-bold text-slate-400">kW</p>
        <p className="text-[11px] text-slate-500">Live</p>
      </div>
    </div>
  );
};

const OrchestratorCommandBar = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [isAsking, setIsAsking] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  const routeLabel = result?.route
    ? result.route.replaceAll('_', ' ')
    : 'multi-agent router';
  const loadingTrace = [
    'Orchestrator is reading the request.',
    'Selecting Analyst, Advisor, or combined route.',
    'Generating the response from the selected agent flow.',
  ];

  const askOrchestrator = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isAsking) return;

    setIsAsking(true);
    setShowTrace(false);
    setResult(null);
    try {
      const response = await axios.post(`${API_BASE}/orchestrator`, { question: trimmedQuestion });
      setResult({
        type: 'done',
        question: trimmedQuestion,
        message: response.data?.answer || "I couldn't get an answer from the orchestrator.",
        agent: response.data?.agent,
        route: response.data?.route,
        trace: response.data?.trace || [],
      });
    } catch (error) {
      setResult({
        type: 'error',
        question: trimmedQuestion,
        message: "Couldn't reach the orchestrator. Please try again.",
      });
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <section className="rounded-2xl border border-sky-300/20 bg-[#07111f] p-3 shadow-[0_0_26px_rgba(59,130,246,0.16)]">
      <form
        onSubmit={askOrchestrator}
        className="flex min-h-[58px] items-center gap-3 rounded-xl border border-sky-300/25 bg-[#0b1728] px-4"
      >
        <Bot className="h-5 w-5 shrink-0 text-sky-300" />
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask Groot about usage, analysis, or savings..."
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-400"
        />
        <span className="hidden text-sm capitalize text-slate-500 md:inline">{routeLabel}</span>
        <button
          type="submit"
          disabled={isAsking}
          aria-label="Ask orchestrator"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-400 text-slate-950 transition hover:bg-sky-300 disabled:cursor-wait disabled:opacity-60"
        >
          {isAsking ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {isAsking && (
        <div className="mt-3 rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-3 text-sm font-semibold text-sky-100">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]" />
            Multi-agent trace
          </div>
          <div className="space-y-1.5 text-xs text-sky-100/80">
            {loadingTrace.map((item, index) => (
              <p key={item}>{index + 1}. {item}</p>
            ))}
          </div>
        </div>
      )}

      {!isAsking && result && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
          {result.type === 'done' ? (
            <>
              {result.trace?.length > 0 && (
                <div className="mb-3 rounded-xl border border-sky-300/25 bg-[#081a2a] px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">Backend Trace</p>
                      <p className="mt-1 text-xs capitalize text-slate-400">{routeLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTrace((current) => !current)}
                      className="rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-xs font-black text-sky-100 transition hover:bg-sky-300/15"
                    >
                      {showTrace ? 'Hide trace' : 'Show trace'}
                    </button>
                  </div>
                  {showTrace && (
                    <div className="mt-3 space-y-2">
                      {result.trace.map((step, index) => (
                        <div key={`${step.agent}-${step.step}-${index}`} className="grid grid-cols-[auto_1fr] gap-3 text-xs">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-400/15 font-black text-sky-200">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-black text-slate-100">
                              {(step.agent || 'agent').replaceAll('_', ' ')} / {step.step}
                            </p>
                            <p className="mt-0.5 text-slate-400">
                              {step.action || step.reason || `Routed to ${(step.selected_agent || step.agent || 'agent').replaceAll('_', ' ')}.`}
                            </p>
                            {step.pdf_sources?.length > 0 && (
                              <p className="mt-1 text-sky-200/80">
                                PDF sources: {step.pdf_sources.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-3 text-sm text-slate-100">
                <FormattedMessage text={result.message} isUser={false} />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm font-black text-red-200">
              {result.message}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const UsageHistory = () => {
  const [data, setData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [showEfficiencyInsight, setShowEfficiencyInsight] = useState(false);
  const liveCategoryData = useMemo(() => buildLiveCategoryData(devices), [devices]);
  const peakMax = Math.max(...liveCategoryData.peakCategories.map((category) => category.value), 0.01);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/analytics/history?period=${period}`);
        const rawData = Array.isArray(res.data) ? res.data : [];
        setData(rawData);
      } catch (error) {
        console.error("Error fetching history data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  useEffect(() => {
    let isMounted = true;

    const fetchDevices = async () => {
      try {
        const res = await axios.get(`${API_BASE}/devices`);
        if (isMounted) {
          setDevices(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Error fetching live devices", error);
      }
    };

    fetchDevices();
    const intervalId = window.setInterval(fetchDevices, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-4 lg:p-6 bg-black text-white font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.16)] lg:text-4xl">Usage History</h2>
          <p className="text-slate-400 text-sm mt-1">Monitoring your energy flow with precision.</p>
        </div>
        
        {/* Navigation Pills */}
        <div className="bg-[#07111f] p-1.5 rounded-2xl flex gap-1 border border-sky-300/15">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                period === p 
                  ? 'bg-[#1d6df2] text-white shadow-[0_0_22px_rgba(29,109,242,0.32)]' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <OrchestratorCommandBar />

      {/* Main Content: Chart + Cards */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 lg:gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Chart */}
          <div
            className="analytics-glow-card relative h-[400px] lg:h-[500px] bg-[#07111f]/90 p-6 lg:p-8 rounded-[2rem] border border-sky-300/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl overflow-hidden"
            style={{ '--glow-color': analyticsColors.purple }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#8b5cf6]"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                  <defs>
                    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={analyticsColors.usage} stopOpacity={0.5}/>
                      <stop offset="95%" stopColor={analyticsColors.usage} stopOpacity={0}/>
                    </linearGradient>

                    <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={analyticsColors.solar} stopOpacity={0.44}/>
                      <stop offset="95%" stopColor={analyticsColors.solar} stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <XAxis 
                    dataKey="timestamp" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 700 }} 
                    dy={15}
                  />
                  
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 700 }} 
                  />
                  
                  <Tooltip 
                    cursor={{
                      stroke: 'rgba(226,232,240,0.75)',
                      strokeWidth: 1,
                    }}
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }} 
                  />

                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ paddingBottom: '30px', fontSize: '13px', fontWeight: '700' }}
                  />

                  <Area
                    type="monotone" 
                    dataKey="usage_kwh" 
                    name="Consumed"
                    stroke={analyticsColors.usage}
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsage)" 
                    filter="url(#glow)"
                    dot={{ r: 3, fill: analyticsColors.usage, strokeWidth: 0 }}
                    activeDot={false}
                    animationDuration={2000}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="solar_kwh" 
                    name="Solar Gen"
                    stroke={analyticsColors.solar}
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSolar)" 
                    filter="url(#glow)"
                    dot={{ r: 3, fill: analyticsColors.solar, strokeWidth: 0 }}
                    activeDot={false}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

        {/* Right Sidebar: 2 Cards */}
        <div className="w-full lg:w-80 space-y-6">
          
          {/* Top Info Box */}
          <div
            className="analytics-glow-card min-h-[170px] bg-[#07111f] border border-sky-300/10 rounded-2xl p-5"
            style={{ '--glow-color': analyticsColors.green }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-white">Predicted High</p>
                <p className="mt-3 text-3xl font-black text-white">9.1 <span className="text-base text-slate-500">kW</span></p>
                <p className="mt-3 text-xs text-slate-400">Best Solar Hour: 12 PM - 1 PM</p>
                <span className="mt-3 inline-flex rounded-lg bg-emerald-400/15 px-3 py-2 text-xs font-black text-emerald-300">
                  High Generation Expected
                </span>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Efficiency Score - Circular */}
          <div
            className="analytics-glow-card min-h-[220px] bg-[#07111f] border border-sky-300/10 rounded-2xl p-5"
            style={{ '--glow-color': analyticsColors.gauge }}
          >
            <p className="text-sm font-black text-white mb-5">Daily Efficiency Score</p>
            <div className="flex items-center gap-5">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={analyticsColors.gauge}
                    strokeWidth="6"
                    strokeDasharray={`${40 * 2 * Math.PI * 0.92} ${40 * 2 * Math.PI}`}
                    strokeLinecap="round"
                    filter="drop-shadow(0 0 6px rgba(59, 130, 246, 0.65))"
                  />
                </svg>
                <p className="relative text-xl font-black leading-none text-white">92%</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white">Excellent!</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">You're using energy very efficiently today.</p>
                <button
                  type="button"
                  onClick={() => setShowEfficiencyInsight((current) => !current)}
                  className="mt-4 rounded-lg border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-black text-sky-300"
                >
                  View Insights -&gt;
                </button>
                {showEfficiencyInsight && (
                  <p className="mt-3 rounded-lg bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-100">
                    Your usage stayed balanced today, with no major peak spikes.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6 mt-1">
          {/* Usage Breakdown by Category */}
          <div
            className="analytics-glow-card min-h-[260px] bg-[#07111f]/90 border border-sky-300/10 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
            style={{ '--glow-color': analyticsColors.pink }}
          >
            <p className="text-sm font-black text-white mb-1">Live Load Breakdown by Category</p>
            <p className="mb-5 text-xs text-slate-500">Based on devices currently ON</p>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <DonutBreakdown categories={liveCategoryData.categories} totalKw={liveCategoryData.totalKw} />
              <div className="min-w-0 flex-1 space-y-4">
                {liveCategoryData.categories.map((category) => (
                  <div key={category.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-5 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="truncate text-slate-300">{category.name}</span>
                    </div>
                    <span className="font-bold text-white">{category.value.toFixed(2)} kW</span>
                    <span className="w-12 text-right text-slate-400">{category.percent.toFixed(1)}%</span>
                  </div>
                ))}
                <button className="pt-2 text-sm font-black text-sky-400">View full breakdown -&gt;</button>
              </div>
            </div>
          </div>

          {/* Peak Demand by Category */}
          <div
            className="analytics-glow-card min-h-[260px] bg-[#07111f] border border-sky-300/10 rounded-2xl p-5"
            style={{ '--glow-color': analyticsColors.blue }}
          >
            <p className="text-sm font-black text-white mb-3">Peak Demand by Category</p>
            <p className="text-xs text-slate-500 mb-6">Live appliance load comparison</p>
            <div className="space-y-5">
              {liveCategoryData.peakCategories.map((category) => (
                <div key={category.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-xs font-black text-white"
                    style={{ backgroundColor: `${category.color}22`, color: category.color }}
                  >
                    {category.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-300">{category.name}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700/60">
                      <div
                        className="h-full rounded-full shadow-[0_0_14px_currentColor]"
                        style={{ width: `${Math.min(100, (category.value / peakMax) * 100)}%`, backgroundColor: category.color, color: category.color }}
                      />
                    </div>
                  </div>
                  <span className="font-black text-white">{category.value.toFixed(2)} kW</span>
                </div>
              ))}
            </div>
            <button className="mt-6 text-sm font-black text-sky-400">View detailed report -&gt;</button>
          </div>
        </div>
      </div>
      <PageGrootInsight
        page="Usage History"
        data={{
          period,
          history: data,
          peakDemandData: liveCategoryData.peakCategories,
          categoryBreakdown: liveCategoryData.categories,
        }}
      />
      <style>{`
        .analytics-glow-card {
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .analytics-glow-card:hover {
          border-color: color-mix(in srgb, var(--glow-color) 30%, transparent);
          box-shadow:
            0 0 28px color-mix(in srgb, var(--glow-color) 30%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default UsageHistory;
