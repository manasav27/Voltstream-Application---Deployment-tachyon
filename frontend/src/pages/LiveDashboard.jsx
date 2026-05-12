import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BatteryCharging, Leaf, TrendingUp, Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

const API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
const sparklineData = [
  { time: '00', value: 1.3 }, 
  { time: '04', value: 1.7 },
  { time: '08', value: 1.5 },
  { time: '12', value: 2.1 },
  { time: '16', value: 2.4 },
  { time: '20', value: 2.0 },
  { time: '24', value: 2.7 }, 
];

const dashboardColors = {
  grid: '#ff4d45',
  solar: '#22c55e',
  balance: '#3b82f6',
  storage: '#f97316',
  warning: '#3b82f6',
  success: '#6ee75a',
};

const rupees = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount);

const RingGauge = ({ value, maxValue, color, size = 112, stroke = 10, children }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(43,45,51,0.95)" strokeWidth={stroke} />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={`drop-shadow(0 0 8px ${color})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

const SmallMetricCard = ({ label, value, color, subtext, chart }) => (
  <div
    className="live-glow-card rounded-2xl border border-white/10 bg-[#17181c] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
    style={{ '--glow-color': color }}
  >
    <div className="flex items-center justify-between gap-4">
      <RingGauge value={value} maxValue={8} color={color} size={110}>
        <div className="text-center">
          <p className="text-xl font-black text-white">{value.toFixed(2)}</p>
          <p className="text-[10px] font-black uppercase text-slate-400">kW</p>
        </div>
      </RingGauge>
      <div className="min-w-0 flex-1 text-right">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-sm font-semibold text-white">{subtext}</p>
      </div>
    </div>
    {chart && <div className="mt-4 h-16">{chart}</div>}
  </div>
);

const Sparkline = ({ color = dashboardColors.balance, data = sparklineData }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.45} />
          <stop offset="95%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <Tooltip
        contentStyle={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          fontSize: '12px',
        }}
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={3}
        fill={`url(#spark-${color.replace('#', '')})`} 
        dot={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const ProgressBar = ({ value, color = dashboardColors.solar }) => (
  <div className="h-2 overflow-hidden rounded-full bg-[#2b2d33]">
    <div
      className="h-full rounded-full shadow-[0_0_16px_rgba(34,197,94,0.35)]"
      style={{
        width: `${Math.max(0, Math.min(100, value))}%`,
        background: color,
      }}
    />
  </div>
);

const LiveDashboard = () => {
  const [liveData, setLiveData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [liveRes, devicesRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/live`),
          axios.get(`${API_BASE}/devices`),
        ]);

        setLiveData(liveRes.data);
        setDevices(Array.isArray(devicesRes.data) ? devicesRes.data : []); // Ensure devices is always an array like a safety check returns list of devices array or an empty array
      } catch (error) {
        console.error('Error fetching live data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    const activeDevices = devices.filter((device) => device.status === 'ON');
    const activeKw = activeDevices.reduce((total, device) => total + (Number(device.power_draw_w) || 0), 0) / 1000;
    const baseSolar = liveData?.solar_generation_kw || 0;
    const baseGrid = liveData?.grid_draw_kw || 0;
    const solarGeneration = Math.max(0, baseSolar + activeKw * 0.18);
    const gridDraw = Math.max(0, baseGrid + activeKw * 0.55 - solarGeneration * 0.35);
    const netUsage = gridDraw - solarGeneration;
    const exportedKw = Math.max(0, -netUsage);
    const bufferKw = Math.max(0, solarGeneration - gridDraw);
    const independenceScore = Math.round(Math.max(8, Math.min(98, (solarGeneration / Math.max(0.1, solarGeneration + gridDraw)) * 100)));
    const solarGoalKwh = Math.min(10, solarGeneration * 2.35);
    const solarGoalPercent = Math.round((solarGoalKwh / 10) * 100);
    const carbonKg = solarGoalKwh * 0.34;
    const dailyCost = gridDraw * 10;
    const solarCostValue = solarGeneration * 8;
    const bufferDevice = activeDevices.length > 0 ? activeDevices[0].name : 'appliances';

    return {
      activeDevices,
      activeKw,
      bufferDevice,
      bufferKw,
      carbonKg,
      dailyCost,
      exportedKw,
      gridDraw,
      independenceScore,
      netUsage,
      solarCostValue,
      solarGeneration,
      solarGoalKwh,
      solarGoalPercent,
    };
  }, [devices, liveData]);

  const dependencyTrend = sparklineData.map((point, index) => ({
    ...point,
    value: Math.max(0.5, point.value + metrics.solarGeneration * 0.12 - index * 0.03),
  }));

  if (loading || !liveData) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#3b82f6]" />
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-y-auto bg-black px-6 py-7 text-white lg:px-9">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_65%_12%,rgba(59,130,246,0.08),transparent_32%),radial-gradient(circle_at_20%_82%,rgba(34,197,94,0.06),transparent_28%)]" />

      <div className="relative z-10 mx-auto max-w-[1240px] space-y-6">
        <header>
          <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.16)]">
            Real Time Metrics
          </h2>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.42em] text-slate-500">Live Energy Monitoring System</p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SmallMetricCard
              label="Grid Draw"
              value={metrics.gridDraw}
              color={dashboardColors.grid}
              subtext={`Cost-to-date: ${rupees(metrics.dailyCost)}`}
            />

            <SmallMetricCard
              label="Solar Gen"
              value={metrics.solarGeneration}
              color={dashboardColors.solar}
              subtext={`Efficiency: ${metrics.independenceScore}%`}
              chart={<Sparkline color={dashboardColors.solar} />}
            />

            <div
              className="live-glow-card flex min-h-[410px] flex-col items-center justify-center gap-5 rounded-2xl border border-white/10 bg-[#17181c] p-5 lg:col-span-2"
              style={{ '--glow-color': dashboardColors.balance }}
            >
              <div className="relative flex h-[310px] w-[310px] items-center justify-center rounded-full bg-[#202126]">
                <RingGauge value={metrics.solarGeneration} maxValue={8} color={dashboardColors.balance} size={310} stroke={12}>
                  <div className="w-[190px] text-center leading-tight">
                    <p className="text-4xl font-black text-white">{metrics.solarGeneration.toFixed(2)}</p>
                    <p className="text-base text-slate-300">kW</p>
                    <p className="mt-1 text-[10px] font-black uppercase text-slate-400">Solar Gen</p>
                    <p className="text-xs text-slate-300">Efficiency: {metrics.independenceScore}%</p>
                    <p className="mt-2 text-xs text-slate-300">Cost-to-date: {rupees(metrics.solarCostValue)}</p>
                    <div className="mx-auto my-2 h-px w-28 bg-white/10" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Net Usage</p>
                    <p className="text-xs text-slate-300">
                      {metrics.netUsage < 0 ? `Daily Export: ${metrics.exportedKw.toFixed(2)} kW` : `Importing: ${metrics.netUsage.toFixed(2)} kW`}
                    </p>
                    <p className={metrics.netUsage < 0 ? 'mt-1 text-xs font-bold text-[#6ee75a]' : 'mt-1 text-xs font-bold text-[#ff4d45]'}>
                      {metrics.netUsage < 0 ? 'net-exporter' : 'grid-assisted'}
                    </p>
                  </div>
                </RingGauge>
              </div>

              <div
                className="live-glow-card w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#202126] p-4"
                style={{ '--glow-color': dashboardColors.storage }}
              >
                <div className="flex items-center gap-4">
                  <BatteryCharging className="h-10 w-10 text-[#f97316]" />
                  <div>
                    <p className="text-3xl font-black text-white">+{metrics.bufferKw.toFixed(2)} kW</p>
                    <p className="text-sm text-white">Free Power Buffer</p>
                    <p className="text-xs text-slate-400">Run {metrics.bufferDevice} now to save.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div
              className="live-glow-card rounded-2xl border border-white/10 bg-[#17181c] p-5 backdrop-blur-xl"
              style={{ '--glow-color': dashboardColors.balance }}
            >
              <div className="flex items-center justify-center">
                <RingGauge value={metrics.independenceScore} maxValue={100} color={dashboardColors.balance} size={125}>
                  <p className="text-2xl font-black text-white">{metrics.independenceScore}%</p>
                </RingGauge>
              </div>
              <p className="mt-2 text-center text-sm text-slate-300">Energy Independence Score: {metrics.independenceScore}%</p>
              <div className="mt-3 h-16">
                <Sparkline color={dashboardColors.balance} data={dependencyTrend} />
              </div>
              <p className="mt-2 text-center text-xs text-slate-500">Today's Off-Grid Status</p>
            </div>

            <div
              className="live-glow-card rounded-2xl border border-white/10 bg-[#17181c] p-5 backdrop-blur-xl"
              style={{ '--glow-color': dashboardColors.solar }}
            >
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">Daily Solar Goal</p>
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <p className="text-sm text-slate-300">Carbon Impact</p>
                  <p className="text-3xl font-black text-white">{metrics.carbonKg.toFixed(1)} kg</p>
                  <p className="text-xs text-slate-500">CO2 Offsets</p>
                </div>
                <Leaf className="h-14 w-14 text-[#22c55e]" />
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <ProgressBar value={metrics.solarGoalPercent} color={dashboardColors.solar} />
                  <p className="mt-2 text-center text-xs text-slate-400">{metrics.solarGoalKwh.toFixed(1)} kWh / 10 kWh</p>
                </div>
                <div className="flex items-center justify-center">
                  <RingGauge value={metrics.solarGoalPercent} maxValue={100} color={dashboardColors.solar} size={92} stroke={8}>
                    <p className="text-lg font-black text-white">{metrics.solarGoalPercent}%</p>
                  </RingGauge>
                </div>
                <ProgressBar value={metrics.solarGoalPercent} color={dashboardColors.success} />
              </div>
            </div>

            <div
              className="live-glow-card rounded-2xl border border-white/10 bg-[#17181c] p-5"
              style={{ '--glow-color': dashboardColors.warning }}
            >
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-[#3b82f6]" />
                <div>
                  <p className="text-sm font-black text-white">Appliances Online</p>
                  <p className="text-xs text-slate-400">{metrics.activeDevices.length} devices drawing {metrics.activeKw.toFixed(2)} kW</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <TrendingUp className="h-4 w-4 text-[#6ee75a]" />
                Values update when Smart Control devices change.
              </div>
            </div>
          </section>
        </div>
      </div>
      <style>{`
        .live-glow-card {
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .live-glow-card:hover {
          border-color: color-mix(in srgb, var(--glow-color) 30%, transparent);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 0 28px color-mix(in srgb, var(--glow-color) 30%, transparent);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default LiveDashboard;
