import {
  CheckCircle2,
  Eye,
  Lightbulb,
  Power,
  Refrigerator,
  Trash2,
  Tv,
  WashingMachine,
  Wind,
} from 'lucide-react';
import { motion } from 'framer-motion';

const getDeviceIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('washing')) return WashingMachine;
  if (lowerName.includes('lamp') || lowerName.includes('light')) return Lightbulb;
  if (lowerName.includes('ac') || lowerName.includes('fan')) return Wind;
  if (lowerName.includes('tv')) return Tv;
  if (lowerName.includes('fridge') || lowerName.includes('refrigerator')) return Refrigerator;
  return Power;
};

const getDeviceColor = (device) => {
  const name = device.name.toLowerCase();
  if (name.includes('ac') || name.includes('fan') || name.includes('heater')) return '#8b5cf6';
  if (name.includes('coffee') || name.includes('oven') || name.includes('dishwasher')) return '#f97316';
  if (name.includes('fridge') || name.includes('refrigerator')) return '#3b82f6';
  if (name.includes('lamp') || name.includes('light')) return '#ec4899';
  if (name.includes('washing')) return '#22c55e';
  if (name.includes('tv')) return '#60a5fa';
  return '#6ee75a';
};

const getSuggestedMode = (device) => {
  if (!device.is_on) return 'Sleep';
  if (device.power_draw_kw >= 1.5) return 'Boost';
  if (device.power_draw_kw >= 0.5) return 'Eco';
  return 'Low';
};

const getLeakSuggestion = (device) => {
  const name = device.name.toLowerCase();
  if (name.includes('fridge') || name.includes('refrigerator')) return 'Check door seal and set cooling to normal mode.';
  if (name.includes('ac') || name.includes('fan') || name.includes('heater')) return 'Clean filter and run eco mode for 20 minutes.';
  if (name.includes('oven') || name.includes('dishwasher') || name.includes('washing')) return 'Delay heavy cycle until low-load hours.';
  if (name.includes('coffee') || name.includes('lamp') || name.includes('light')) return 'Use an auto-off timer after peak use.';
  return 'Review runtime and switch to sleep mode when idle.';
};

export const SummaryCard = ({ title, value, detail, Icon, color }) => (
  <div
    className="rounded-2xl border border-white/10 bg-[#202126] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    style={{
      borderColor: `${color}44`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px ${color}18`,
    }}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-300">{title}</p>
        <p className="mt-3 text-2xl font-black text-white">{value}</p>
        {detail && <p className="mt-2 text-sm text-slate-400">{detail}</p>}
      </div>
      <Icon className="h-6 w-6 shrink-0" style={{ color }} />
    </div>
  </div>
);

export const DeviceCard = ({ device, index, onToggle, onDelete, roomColor }) => {
  const DeviceIcon = getDeviceIcon(device.name);
  const accent = roomColor || getDeviceColor(device);
  const suggestedMode = getSuggestedMode(device);
  const watts = device.is_on ? device.power_draw_w : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24, delay: index * 0.03 }}
      style={device.is_on ? {
        borderColor: `${accent}88`,
        boxShadow: `0 0 30px ${accent}30`,
      } : undefined}
      className={`min-h-[138px] rounded-2xl border p-3.5 backdrop-blur-xl transition-all ${
        device.is_on
          ? 'bg-[#202126]'
          : 'border-white/10 bg-slate-950/35 opacity-90'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${device.is_on ? 'text-slate-950' : 'bg-white/10 text-slate-400'}`}
            style={device.is_on ? { backgroundColor: accent } : undefined}
          >
            Device
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${device.is_on ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-400'}`}>
            {device.is_on ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label={`Delete ${device.name}`}
            onClick={() => onDelete(device.id)}
            className="grid h-8 w-8 place-items-center rounded-full border border-red-300/20 bg-red-400/10 text-red-200 transition hover:bg-red-400/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            aria-label={`Toggle ${device.name}`}
            onClick={() => onToggle(device.id)}
            className={`relative h-6 w-12 rounded-full transition-colors ${device.is_on ? '' : 'bg-white/10'}`}
            style={device.is_on ? { backgroundColor: accent } : undefined}
          >
            <motion.span
              animate={{ x: device.is_on ? 25 : 4 }}
              className="absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow-lg"
            />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h4 className="truncate text-base font-black text-white">{device.name}</h4>
          <p className={`mt-1.5 text-xl font-black ${device.is_on ? 'text-white' : 'text-slate-500'}`}>
            {(watts / 1000).toFixed(watts >= 1000 ? 1 : 2).replace(/\.0$|0$/g, '')} <span className="text-sm">kW</span>
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Suggest Mode <span className="ml-2 rounded-lg bg-slate-600/50 px-2.5 py-1 text-xs font-black uppercase text-white">{suggestedMode}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-center">
          <DeviceIcon className={`h-9 w-9 ${device.is_on ? '' : 'text-slate-600'}`} style={device.is_on ? { color: accent } : undefined} />
        </div>
      </div>
    </motion.div>
  );
};

export const ProactiveLeakDetector = ({
  leakDevices,
  activeActionId,
  deliveredId,
  selectedSlot,
  onTroubleshoot,
  onSchedule,
  onSelectSlot,
}) => {
  const serviceSlots = ['10:30 AM', '1:15 PM', '4:45 PM'];

  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#202126] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-black leading-tight text-white">Proactive Energy Leaks AI Detector</h3>
        <Eye className="h-8 w-8 shrink-0 text-sky-200/80" />
      </div>

      {leakDevices.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-emerald-300">
          <p className="flex items-center gap-2 font-black">
            <CheckCircle2 className="h-5 w-5" />
            All Clear
          </p>
          <p className="mt-2 text-sm text-emerald-100/80">No active device is drawing unusual power in this room.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {leakDevices.map((device) => {
            const isServiceDevice = device.type === 'HVAC' || device.power_draw_w >= 1000;
            const isOpen = activeActionId === device.id;
            const isDelivered = deliveredId === device.id;

            return (
              <div key={device.id} className="rounded-2xl border border-orange-300/20 bg-orange-400/10 p-3">
                <p className="text-sm text-white">
                  <span className="font-black">{device.name}:</span> {device.power_draw_w.toFixed(0)} W while active
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => onTroubleshoot(device.id)}
                    className="rounded-xl border border-sky-300/25 bg-sky-300/15 px-3 py-2 text-sm font-black text-sky-200"
                  >
                    Troubleshoot?
                  </button>
                  {isServiceDevice && (
                    <button
                      onClick={() => onSchedule(device.id)}
                      className="rounded-xl border border-orange-300/20 bg-orange-300/10 px-3 py-2 text-sm font-black text-orange-200"
                    >
                      Schedule Service
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white">
                    <p className="font-semibold text-emerald-100">{getLeakSuggestion(device)}</p>
                    {selectedSlot?.deviceId === device.id && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {serviceSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => onSelectSlot(device.id, slot)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-black ${
                              selectedSlot.slot === slot
                                ? 'bg-emerald-400 text-slate-950'
                                : 'bg-white/10 text-white hover:bg-white/15'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                    {isDelivered && (
                      <p className="mt-3 rounded-lg bg-emerald-400/15 px-3 py-2 text-xs font-black text-emerald-300">
                        Delivered. Technician slot confirmed.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
