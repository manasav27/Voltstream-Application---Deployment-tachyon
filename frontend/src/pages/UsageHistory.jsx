import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
const axisLabels = {
  daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  weekly: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
  monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const analyticsColors = {
  card: '#17181c',
  cardSoft: '#202126',
  purple: '#8b5cf6',
  pink: '#3b82f6',
  red: '#ff4d45',
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  usage: '#8b5cf6',
  solar: '#3b82f6',
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

const peakDemandData = [
  { day: 'Mon', hvac: 3.8, kitchen: 2.1, devices: 1.2 },
  { day: 'Tue', hvac: 4.4, kitchen: 2.8, devices: 1.5 },
  { day: 'Wed', hvac: 5.1, kitchen: 3.2, devices: 1.7 },
  { day: 'Thu', hvac: 4.2, kitchen: 3.5, devices: 1.4 },
  { day: 'Fri', hvac: 5.8, kitchen: 3.9, devices: 1.9 },
  { day: 'Sat', hvac: 6.4, kitchen: 4.4, devices: 2.2 },
  { day: 'Sun', hvac: 4.9, kitchen: 3.1, devices: 1.6 },
];

const PeakDemandChart = () => (
  <ResponsiveContainer width="100%" height={180}>
    <LineChart data={peakDemandData}>
      <defs>
        <filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
      <YAxis hide />
      <Tooltip
        cursor={false}
        contentStyle={{
          backgroundColor: '#17181c',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.75rem',
          color: '#fff',
        }}
      />
      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
      <Line type="monotone" dataKey="hvac" name="HVAC" stroke={analyticsColors.purple} strokeWidth={3} filter="url(#lineGlow)" dot={{ r: 4, fill: analyticsColors.purple, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
      <Line type="monotone" dataKey="kitchen" name="Kitchen" stroke={analyticsColors.blue} strokeWidth={3} filter="url(#lineGlow)" dot={{ r: 4, fill: analyticsColors.blue, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
      <Line type="monotone" dataKey="devices" name="Devices" stroke={analyticsColors.green} strokeWidth={3} filter="url(#lineGlow)" dot={{ r: 4, fill: analyticsColors.green, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
    </LineChart>
  </ResponsiveContainer>
);

const UsageHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/analytics/history?period=${period}`);
        const rawData = Array.isArray(res.data) ? res.data : [];
        const labels = axisLabels[period] || axisLabels.daily;
        setData(rawData.map((point, index) => ({
          ...point,
          timestamp: labels[index] || point.timestamp,
        })));
      } catch (error) {
        console.error("Error fetching history data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  return (
    <div className="min-h-screen flex flex-col p-4 lg:p-6 bg-black text-white font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.16)] lg:text-4xl">Usage History</h2>
          <p className="text-slate-400 text-sm mt-1">Monitoring your energy flow with precision.</p>
        </div>
        
        {/* Navigation Pills */}
        <div className="bg-[#202126] p-1.5 rounded-2xl flex gap-1 border border-white/10">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                period === p 
                  ? 'bg-[#ff4d45] text-white shadow-[0_0_22px_rgba(255,77,69,0.32)]' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Chart + Cards */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 lg:gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Chart */}
          <div
            className="analytics-glow-card relative h-[400px] lg:h-[500px] bg-[#17181c]/85 p-6 lg:p-8 rounded-[2rem] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl overflow-hidden"
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
                    cursor={false}
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
                    activeDot={{ r: 6, fill: analyticsColors.usage, stroke: '#fff', strokeWidth: 2 }}
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
                    activeDot={{ r: 6, fill: analyticsColors.solar, stroke: '#fff', strokeWidth: 2 }}
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
            className="analytics-glow-card min-h-[170px] bg-[#17181c] border border-white/10 rounded-2xl p-6"
            style={{ '--glow-color': analyticsColors.prediction }}
          >
            <p className="text-xs font-bold text-slate-400 mb-5">Predicted High</p>
            <p className="text-2xl font-black text-white">9.1 <span className="text-sm text-slate-500">kW</span></p>
            <p className="text-xs text-slate-400 mt-5">Best Solar Hour: 12 PM</p>
          </div>

          {/* Efficiency Score - Circular */}
          <div
            className="analytics-glow-card min-h-[220px] bg-[#17181c] border border-white/10 rounded-2xl p-6"
            style={{ '--glow-color': analyticsColors.gauge }}
          >
            <p className="text-xs font-bold text-slate-400 mb-5">Daily Efficiency Score</p>
            <div className="flex justify-center">
              <div className="relative w-28 h-28">
                <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xl font-black text-white">92%</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6 mt-1">
          {/* Usage Breakdown by Category */}
          <div
            className="analytics-glow-card min-h-[260px] bg-[#17181c]/85 border border-white/10 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
            style={{ '--glow-color': analyticsColors.pink }}
          >
            <p className="text-xs font-bold text-slate-400 mb-5">Usage Breakdown by Category</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: analyticsColors.categoryA }}></div>
                  <span className="text-slate-400">Heating:</span>
                </div>
                <span className="font-bold text-slate-300">3.5 kWh</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: analyticsColors.categoryB }}></div>
                  <span className="text-slate-400">Kitchen:</span>
                </div>
                <span className="font-bold text-slate-300">2.1 kWh</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: analyticsColors.categoryC }}></div>
                  <span className="text-slate-400">Entertainment:</span>
                </div>
                <span className="font-bold text-slate-300">0.8 kWh</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: analyticsColors.categoryD }}></div>
                  <span className="text-slate-400">Citizen:</span>
                </div>
                <span className="font-bold text-slate-300">0.3 kWh</span>
              </div>
            </div>
          </div>

          {/* Peak Demand Chart */}
          <div
            className="analytics-glow-card min-h-[260px] bg-[#17181c] border border-white/10 rounded-2xl p-5"
            style={{ '--glow-color': analyticsColors.blue }}
          >
            <p className="text-xs font-bold text-slate-400 mb-4">Peak Demand by Category</p>
            <p className="text-xs text-slate-500 mb-4">Weekly appliance load comparison</p>
            <PeakDemandChart />
          </div>
        </div>
      </div>
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
