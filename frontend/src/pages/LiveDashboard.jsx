import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AirVent,
  BatteryCharging,
  Car,
  CloudSun,
  Leaf,
  Lightbulb,
  PlugZap,
  Refrigerator,
  ShieldCheck,
  Sun,
  TreePine,
  Tv,
  UtilityPole,
  WashingMachine,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageGrootInsight from '../components/PageGrootInsight';

const LOCAL_API_BASE = 'http://127.0.0.1:8000/api/v1';
const DEPLOYED_API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_BASE : DEPLOYED_API_BASE);

const dashboardColors = {
  grid: '#ff4d45',
  solar: '#22c55e',
  balance: '#3b82f6',
  storage: '#f97316',
  success: '#6ee75a',
  gold: '#fbbf24',
};

const trendData = [
  { time: '12 AM', solar: 0.7, consumption: 3.8, grid: 2.0 },
  { time: '1 AM', solar: 0.9, consumption: 3.6, grid: 1.8 },
  { time: '2 AM', solar: 1.1, consumption: 3.9, grid: 2.1 },
  { time: '3 AM', solar: 1.4, consumption: 4.0, grid: 1.7 },
  { time: '4 AM', solar: 1.2, consumption: 4.4, grid: 2.2 },
  { time: '5 AM', solar: 1.8, consumption: 5.1, grid: 1.4 },
  { time: '6 AM', solar: 2.5, consumption: 5.8, grid: 0.8 },
  { time: '7 AM', solar: 2.1, consumption: 5.2, grid: 1.1 },
  { time: '8 AM', solar: 3.0, consumption: 5.7, grid: 0.6 },
  { time: '9 AM', solar: 3.7, consumption: 6.4, grid: 1.3 },
  { time: '10 AM', solar: 4.1, consumption: 6.8, grid: 0.7 },
  { time: '11 AM', solar: 4.8, consumption: 7.9, grid: 1.0 },
  { time: '12 PM', solar: 5.4, consumption: 8.5, grid: 0.8 },
  { time: '1 PM', solar: 5.0, consumption: 7.6, grid: 1.4 },
  { time: '2 PM', solar: 4.7, consumption: 7.1, grid: 1.1 },
  { time: '3 PM', solar: 4.3, consumption: 7.8, grid: 1.7 },
  { time: '4 PM', solar: 3.9, consumption: 7.0, grid: 1.9 },
  { time: '5 PM', solar: 3.1, consumption: 6.1, grid: 1.5 },
  { time: '6 PM', solar: 2.7, consumption: 5.8, grid: 1.0 },
  { time: '7 PM', solar: 3.2, consumption: 6.2, grid: 0.7 },
  { time: '8 PM', solar: 2.3, consumption: 5.6, grid: 0.6 },
  { time: '9 PM', solar: 2.8, consumption: 6.0, grid: 1.0 },
  { time: '10 PM', solar: 2.0, consumption: 6.4, grid: 0.8 },
  { time: '11 PM', solar: 2.6, consumption: 6.1, grid: 0.7 },
  { time: '12 AM', solar: 2.1, consumption: 5.7, grid: 0.5 },
];

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
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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

const DashboardCard = ({ children, color = dashboardColors.balance, className = '' }) => (
  <div
    className={`live-glow-card rounded-2xl border border-white/10 bg-[#081321]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.34)] backdrop-blur-xl ${className}`}
    style={{ '--glow-color': color }}
  >
    {children}
  </div>
);

const MetricCard = ({ title, value, unit, color, Icon, detail, percent }) => (
  <DashboardCard color={color} className="min-h-[190px] p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-200">{title}</p>
        <div className="mt-5 flex items-center gap-4">
          <RingGauge value={value} maxValue={8} color={color} size={108} stroke={9}>
            <div className="text-center">
              <p className="text-2xl font-black text-white">{value.toFixed(2)}</p>
              <p className="text-xs text-slate-300">{unit}</p>
            </div>
          </RingGauge>
          <div>
            <p className="text-xs text-slate-400">{detail.label}</p>
            <p className="mt-1 text-xl font-black text-white">{detail.value}</p>
          </div>
        </div>
      </div>
      <Icon className="h-8 w-8" style={{ color }} />
    </div>
    {percent !== undefined && (
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: color }}
        />
      </div>
    )}
  </DashboardCard>
);

const SummaryRow = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <div className="flex items-center gap-3 text-slate-300">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/8" style={{ color }}>
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </div>
    <span className="font-black text-white">{value}</span>
  </div>
);

const getDeviceIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('ac') || lowerName.includes('fan') || lowerName.includes('heater')) return AirVent;
  if (lowerName.includes('refrigerator') || lowerName.includes('fridge')) return Refrigerator;
  if (lowerName.includes('washing')) return WashingMachine;
  if (lowerName.includes('lamp') || lowerName.includes('light')) return Lightbulb;
  if (lowerName.includes('tv')) return Tv;
  return PlugZap;
};

const ApplianceBadge = ({ Icon, label }) => (
  <div className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-100 shadow-[0_0_16px_rgba(59,130,246,0.16)]" title={label}>
    <Icon className="h-5 w-5" />
  </div>
);

const ProgressBar = ({ value, color = dashboardColors.solar }) => (
  <div className="h-2 overflow-hidden rounded-full bg-white/10">
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
        setDevices(Array.isArray(devicesRes.data) ? devicesRes.data : []);
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
    const consumption = gridDraw + solarGeneration;
    const netUsage = Math.abs(consumption - solarGeneration);
    const independenceScore = Math.round(Math.max(8, Math.min(98, (solarGeneration / Math.max(0.1, consumption)) * 100)));
    const solarGoalKwh = Math.min(10, solarGeneration * 2.35);
    const solarGoalPercent = Math.round((solarGoalKwh / 10) * 100);
    const carbonKg = solarGoalKwh * 0.34;
    const dailyCost = gridDraw * 10;
    const treesSaved = Math.max(1, Math.round(carbonKg * 3.6));
    const kmNotDriven = Math.round(carbonKg * 7.6);

    return {
      activeDevices,
      activeKw,
      carbonKg,
      consumption,
      dailyCost,
      gridDependency: 100 - independenceScore,
      gridDraw,
      independenceScore,
      kmNotDriven,
      netUsage,
      solarGeneration,
      solarGoalKwh,
      solarGoalPercent,
      treesSaved,
    };
  }, [devices, liveData]);

  const chartData = trendData.map((point, index) => ({
    ...point,
    solar: Math.max(0.2, point.solar + metrics.solarGeneration * 0.08 - index * 0.03),
    consumption: Math.max(1, point.consumption + metrics.consumption * 0.08),
    grid: Math.max(0.2, point.grid + metrics.gridDraw * 0.05 - index * 0.04),
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_10%,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_18%_80%,rgba(34,197,94,0.08),transparent_28%)]" />

      <div className="relative z-10 mx-auto max-w-[1240px] space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.16)]">
              Real Time Metrics
            </h2>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.42em] text-sky-300/80">Live Energy Monitoring System</p>
          </div>
          <DashboardCard className="hidden" color={dashboardColors.balance}>
            <CloudSun className="h-9 w-9 text-yellow-200" />
            <div>
              <p className="text-lg font-black text-white">28°C</p>
              <p className="text-xs text-slate-400">Mostly Cloudy</p>
            </div>
          </DashboardCard>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <main className="space-y-5">
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <MetricCard
                title="Grid Draw"
                value={metrics.gridDraw}
                unit="kW"
                color={dashboardColors.grid}
                Icon={UtilityPole}
                detail={{ label: 'Cost-to-date', value: rupees(metrics.dailyCost) }}
              />
              <MetricCard
                title="Solar Generation"
                value={metrics.solarGeneration}
                unit="kW"
                color={dashboardColors.solar}
                Icon={Sun}
                detail={{ label: 'Efficiency', value: `${metrics.independenceScore}%` }}
                percent={metrics.independenceScore}
              />
              <MetricCard
                title="Energy Independence"
                value={metrics.independenceScore}
                unit="%"
                color={dashboardColors.balance}
                Icon={ShieldCheck}
                detail={{ label: 'Grid Dependency', value: `${metrics.gridDependency}%` }}
                percent={metrics.independenceScore}
              />
            </section>

            <DashboardCard className="relative min-h-[410px] overflow-hidden p-5" color={dashboardColors.balance}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-200">Live Power Flow</p>

              <div className="relative z-10 mt-6 flex justify-center">
                <RingGauge value={metrics.solarGeneration} maxValue={8} color={dashboardColors.balance} size={285} stroke={12}>
                  <div className="w-[170px] text-center leading-tight">
                    <p className="text-4xl font-black text-white">{metrics.solarGeneration.toFixed(2)}</p>
                    <p className="text-base text-slate-300">kW</p>
                    <p className="mt-2 text-[10px] font-black uppercase text-slate-400">Solar Gen</p>
                    <p className="text-xs text-slate-300">Efficiency: {metrics.independenceScore}%</p>
                    <p className="mt-2 text-xs text-slate-300">Cost-to-date: {rupees(metrics.solarGeneration * 8)}</p>
                    <div className="mx-auto my-3 h-px w-28 bg-white/10" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Net Usage</p>
                    <p className="text-xs text-slate-300">{metrics.netUsage.toFixed(2)} kW</p>
                  </div>
                </RingGauge>
              </div>
            </DashboardCard>

            <DashboardCard className="h-[300px] p-5" color={dashboardColors.balance}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-200">Energy Trend</p>
              <div className="mt-3 h-[235px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <defs>
                      <filter id="trendGlowGreen" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="trendGlowBlue" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="trendGlowRed" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#081321',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="linear"
                      dataKey="solar"
                      name="Solar Generation"
                      stroke={dashboardColors.solar}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={{ r: 2, fill: dashboardColors.solar, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: dashboardColors.solar, stroke: '#fff', strokeWidth: 1 }}
                      filter="url(#trendGlowGreen)"
                    />
                    <Line
                      type="linear"
                      dataKey="consumption"
                      name="Consumption"
                      stroke={dashboardColors.balance}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={{ r: 2, fill: dashboardColors.balance, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: dashboardColors.balance, stroke: '#fff', strokeWidth: 1 }}
                      filter="url(#trendGlowBlue)"
                    />
                    <Line
                      type="linear"
                      dataKey="grid"
                      name="Grid Draw"
                      stroke={dashboardColors.grid}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="9 3"
                      dot={{ r: 2, fill: dashboardColors.grid, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: dashboardColors.grid, stroke: '#fff', strokeWidth: 1 }}
                      filter="url(#trendGlowRed)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>
          </main>

          <aside className="space-y-4">
            <DashboardCard className="p-5" color={dashboardColors.gold}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-200">Today's Summary</p>
              <div className="mt-5 space-y-4">
                <SummaryRow icon={BatteryCharging} label="Total Generation" value={`${(metrics.solarGeneration * 8.5).toFixed(1)} kWh`} color={dashboardColors.gold} />
                <SummaryRow icon={Zap} label="Total Consumption" value={`${(metrics.consumption * 6.7).toFixed(1)} kWh`} color={dashboardColors.balance} />
                <SummaryRow icon={PlugZap} label="Net Usage" value={`${metrics.netUsage.toFixed(1)} kWh`} color={dashboardColors.solar} />
                <SummaryRow icon={UtilityPole} label="Grid Dependency" value={`${metrics.gridDependency}%`} color={dashboardColors.grid} />
              </div>
            </DashboardCard>

            <DashboardCard className="p-5" color={dashboardColors.solar}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-200">Daily Solar Goal</p>
                <Leaf className="h-8 w-8 text-[#22c55e]" />
              </div>
              <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-5">
                <div>
                  <p className="text-sm text-slate-300">Carbon Impact</p>
                  <p className="mt-1 text-3xl font-black text-white">{metrics.carbonKg.toFixed(1)} kg</p>
                  <p className="text-xs text-slate-500">CO2 Offset</p>
                </div>
                <RingGauge value={metrics.solarGoalPercent} maxValue={100} color={dashboardColors.solar} size={92} stroke={8}>
                  <p className="text-lg font-black text-white">{metrics.solarGoalPercent}%</p>
                </RingGauge>
              </div>
              <div className="mt-4">
                <ProgressBar value={metrics.solarGoalPercent} color={dashboardColors.solar} />
                <p className="mt-2 text-center text-xs text-slate-400">{metrics.solarGoalKwh.toFixed(1)} kWh / 10 kWh</p>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5" color={dashboardColors.success}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-200">Environmental Impact</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div>
                  <Leaf className="mx-auto h-7 w-7 text-[#22c55e]" />
                  <p className="mt-2 text-sm font-black text-white">{metrics.carbonKg.toFixed(1)} kg</p>
                  <p className="text-[10px] text-slate-500">CO2 Offset</p>
                </div>
                <div>
                  <TreePine className="mx-auto h-7 w-7 text-[#22c55e]" />
                  <p className="mt-2 text-sm font-black text-white">{metrics.treesSaved}</p>
                  <p className="text-[10px] text-slate-500">Trees Saved</p>
                </div>
                <div>
                  <Car className="mx-auto h-7 w-7 text-[#22c55e]" />
                  <p className="mt-2 text-sm font-black text-white">{metrics.kmNotDriven} km</p>
                  <p className="text-[10px] text-slate-500">Not Driven</p>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5" color={dashboardColors.balance}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-200">Appliances Online</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {metrics.activeDevices.slice(0, 5).map((device) => (
                  <ApplianceBadge
                    key={device.id}
                    Icon={getDeviceIcon(device.name)}
                    label={`${device.name} online`}
                  />
                ))}
                {metrics.activeDevices.length > 5 && (
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-sky-400/10 text-sm font-black text-sky-200">
                    +{metrics.activeDevices.length - 5}
                  </div>
                )}
                {metrics.activeDevices.length === 0 && (
                  <p className="text-sm text-slate-500">No appliances are online.</p>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-400">{metrics.activeDevices.length} active devices</p>
            </DashboardCard>
          </aside>
        </div>

        <PageGrootInsight
          page="Real Time Metrics"
          data={{
            liveData,
            metrics,
            activeDevices: metrics.activeDevices,
          }}
        />
      </div>

      <style>{`
        .live-glow-card {
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .live-glow-card:hover {
          border-color: color-mix(in srgb, var(--glow-color) 32%, transparent);
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
