import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Bath,
  Bed,
  CheckCircle2,
  Coffee,
  Eye,
  Lightbulb,
  Plus,
  Power,
  Refrigerator,
  Trash2,
  Tv,
  WashingMachine,
  Wind,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageGrootInsight from '../components/PageGrootInsight';

const LOCAL_API_BASE = 'http://127.0.0.1:8000/api/v1';
const DEPLOYED_API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_BASE : DEPLOYED_API_BASE);

const rooms = [
  { name: 'Living Room', icon: Tv, color: '#f97316' },
  { name: 'Kitchen', icon: Coffee, color: '#3b82f6' },
  { name: 'Bedroom', icon: Bed, color: '#8b5cf6' },
  { name: 'Bathroom', icon: Bath, color: '#ff4d45' },
];

const getDefaultPower = (device) => {
  if (device.default_power_w) return device.default_power_w;
  const name = device.name.toLowerCase();
  if (name.includes('oven')) return 2200;
  if (name.includes('water heater')) return 2000;
  if (name.includes('heater')) return 1500;
  if (name.includes('ac')) return name.includes('bedroom') ? 1200 : 1500;
  if (name.includes('dishwasher')) return 1200;
  if (name.includes('coffee')) return 900;
  if (name.includes('washing')) return 500;
  if (name.includes('refrigerator') || name.includes('fridge')) return 400;
  if (name.includes('tv')) return 180;
  if (name.includes('fan')) return 75;
  if (name.includes('lamp') || name.includes('light')) return 60;
  return device.type === 'Vehicle' ? 7200 : device.type === 'HVAC' ? 1200 : 400;
};

const getDeviceRoom = (device) => {  
  const name = device.name.toLowerCase();
  if (name.includes('kitchen') || name.includes('refrigerator') || name.includes('fridge') || name.includes('dishwasher') || name.includes('coffee') || name.includes('oven')) return 'Kitchen';
  if (name.includes('bedroom') || name.includes('bedside')) return 'Bedroom';  
  if (name.includes('bathroom') || name.includes('water heater')) return 'Bathroom';
  return 'Living Room';
};

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

const SummaryCard = ({ title, value, detail, Icon, color }) => (
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

const DeviceCard = ({ device, index, onToggle, onDelete, roomColor }) => {
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

const ProactiveLeakDetector = ({
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

const SmartControl = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState('Living Room');
  const [activeLeakActionId, setActiveLeakActionId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [deliveredId, setDeliveredId] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'Appliance',
    status: 'OFF',
    power_draw_w: 100,
  });

  const hydrateDevice = (device) => ({
    ...device,
    room: device.room || getDeviceRoom(device),
    is_on: device.status === 'ON',
    power_draw_kw: device.power_draw_w ? device.power_draw_w / 1000 : 0,
  });

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await axios.get(`${API_BASE}/devices`);
        setDevices(res.data.map(hydrateDevice));
      } catch (error) {
        console.error('Error fetching devices', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleDeviceUpdated = (event) => {
      const updatedDevice = event.detail;
      if (!updatedDevice?.id) return;

      setDevices((prevDevices) => prevDevices.map((device) =>
        device.id === updatedDevice.id
          ? {
              ...device,
              ...updatedDevice,
              room: updatedDevice.room || device.room || getDeviceRoom(updatedDevice),
              is_on: updatedDevice.status === 'ON',
              power_draw_kw: updatedDevice.power_draw_w ? updatedDevice.power_draw_w / 1000 : 0,
            }
          : device
      ));
    };

    window.addEventListener('voltstream-device-updated', handleDeviceUpdated);
    return () => window.removeEventListener('voltstream-device-updated', handleDeviceUpdated);
  }, []);

  const toggleDevice = async (id) => {
    const deviceToUpdate = devices.find((device) => device.id === id);
    if (!deviceToUpdate) return;

    const updatedStatus = !deviceToUpdate.is_on;
    const optimisticWatts = updatedStatus ? getDefaultPower(deviceToUpdate) : 0;

    setDevices((prevDevices) => prevDevices.map((device) =>
      device.id === id
        ? {
            ...device,
            is_on: updatedStatus,
            status: updatedStatus ? 'ON' : 'OFF',
            power_draw_w: optimisticWatts,
            power_draw_kw: optimisticWatts / 1000,
          }
        : device
    ));

    try {
      const res = await axios.patch(`${API_BASE}/devices/${id}?status=${updatedStatus ? 'ON' : 'OFF'}`);
      const persisted = res.data;
      setDevices((prevDevices) => prevDevices.map((device) =>
        device.id === id
          ? {
              ...device,
              ...persisted,
              room: persisted.room || device.room || getDeviceRoom(persisted),
              is_on: persisted.status === 'ON',
              power_draw_kw: persisted.power_draw_w ? persisted.power_draw_w / 1000 : 0,
            }
          : device
      ));
    } catch (error) {
      console.error('Failed to persist device state:', error);
      setDevices((prevDevices) => prevDevices.map((device) =>
        device.id === id
          ? {
              ...device,
              is_on: !updatedStatus,
              status: !updatedStatus ? 'ON' : 'OFF',
              power_draw_w: deviceToUpdate.power_draw_w,
              power_draw_kw: deviceToUpdate.power_draw_kw,
            }
          : device
      ));
    }
  };

  const addDevice = async (event) => {
    event.preventDefault();
    const trimmedName = newDevice.name.trim();
    if (!trimmedName) return;

    const powerDraw = Math.max(0, Number(newDevice.power_draw_w) || 0);

    try {
      const res = await axios.post(`${API_BASE}/devices`, {
        name: trimmedName,
        type: newDevice.type,
        room: selectedRoom,
        status: newDevice.status,
        power_draw_w: powerDraw,
      });

      setDevices((prevDevices) => [...prevDevices, hydrateDevice(res.data)]);
      setNewDevice({
        name: '',
        type: 'Appliance',
        status: 'OFF',
        power_draw_w: 100,
      });
      setShowAddDevice(false);
    } catch (error) {
      console.error('Failed to add device:', error);
    }
  };

  const deleteDevice = async (id) => {
    const deviceToDelete = devices.find((device) => device.id === id);
    if (!deviceToDelete) return;

    setDevices((prevDevices) => prevDevices.filter((device) => device.id !== id));

    try {
      await axios.delete(`${API_BASE}/devices/${id}`);
    } catch (error) {
      console.error('Failed to delete device:', error);
      setDevices((prevDevices) => [...prevDevices, deviceToDelete]);
    }
  };

  const filteredDevices = useMemo(  // gets only the devices for the selected room, and recalculates when devices or selectedRoom changes
    () => devices.filter((device) => device.room === selectedRoom),
    [devices, selectedRoom]
  );

  const activeDevices = filteredDevices.filter((device) => device.is_on); // keeps only devices which are on
  const totalWatts = activeDevices.reduce((total, device) => total + (Number(device.power_draw_w) || 0), 0);
  const activeDeviceNames = activeDevices.map((device) => device.name).join(', ');
  const SelectedRoomIcon = rooms.find((room) => room.name === selectedRoom)?.icon || Tv;
  const selectedRoomColor = rooms.find((room) => room.name === selectedRoom)?.color || '#60a5fa';
  const leakDevices = activeDevices
    .filter((device) => device.power_draw_w >= 350 || device.type === 'HVAC')
    .sort((a, b) => b.power_draw_w - a.power_draw_w)
    .slice(0, 2);

  const openTroubleshoot = (deviceId) => {
    setActiveLeakActionId(deviceId);
    setSelectedSlot(null);
    setDeliveredId(null);
  };

  const openSchedule = (deviceId) => {
    setActiveLeakActionId(deviceId);
    setSelectedSlot({ deviceId, slot: null });
    setDeliveredId(null);
  };

  const confirmSlot = (deviceId, slot) => {
    setSelectedSlot({ deviceId, slot });
    setDeliveredId(deviceId);
  };

  return (
    <div className="h-screen overflow-y-auto bg-black px-5 py-6 text-white lg:px-7">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
        <header>
          <h2 className="text-3xl font-black text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.16)]">Devices</h2>
          <p className="mt-1 text-sm text-slate-400">Manage and monitor your smart devices</p>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {rooms.map((room) => {
            const Icon = room.icon;
            const roomDevices = devices.filter((device) => device.room === room.name);
            const isSelected = selectedRoom === room.name;

            return (
              <button
                key={room.name}
                onClick={() => setSelectedRoom(room.name)}
                style={isSelected ? {
                  borderColor: `${room.color}99`,
                  boxShadow: `0 0 28px ${room.color}30`,
                } : undefined}
                className={`flex min-h-[54px] items-center gap-3 rounded-full border px-5 text-left text-base font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#202126] text-white'
                    : 'border-white/10 bg-white/10 text-slate-300 hover:border-white/25 hover:bg-white/15'
                }`}
              >
                <Icon className={isSelected ? 'h-6 w-6' : 'h-6 w-6 text-slate-300'} style={isSelected ? { color: room.color } : undefined} />
                <span>{room.name}</span>
                <span className="ml-auto rounded-full bg-black/20 px-2 py-1 text-xs text-slate-300">{roomDevices.length}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="glass-shell flex min-h-[520px] items-center justify-center rounded-[2.5rem] border border-white/10 bg-[#17181c] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.42)]">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-emerald-300" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
              <div className="space-y-4">
                <SummaryCard
                  title="Total Room Draw"
                  value={`${(totalWatts / 1000).toFixed(2)} kW`}
                  detail="Based on devices currently ON"
                  Icon={Power}
                  color={selectedRoomColor}
                />
                <ProactiveLeakDetector
                  leakDevices={leakDevices}
                  activeActionId={activeLeakActionId}
                  deliveredId={deliveredId}
                  selectedSlot={selectedSlot}
                  onTroubleshoot={openTroubleshoot}
                  onSchedule={openSchedule}
                  onSelectSlot={confirmSlot}
                />
              </div>

              <SummaryCard
                title="Active Devices"
                value={activeDevices.length}
                detail={activeDeviceNames || 'No devices online'}
                Icon={CheckCircle2}
                color={selectedRoomColor}
              />

              <aside>
                <div className="rounded-2xl border border-white/10 bg-[#202126] p-4">
                  <h3 className="text-lg font-black text-white">{selectedRoom} at a Glance</h3>
                  <div className="mt-4">
                    <div>
                      <p className="text-sm text-slate-300">Total Room Draw:</p>
                      <p className="text-2xl font-black">{totalWatts.toFixed(0)} W</p>
                    </div>
                  </div>
                </div>
              </aside>
            </section>

            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <SelectedRoomIcon
                    className="h-6 w-6"
                    style={{ color: selectedRoomColor }}
                  />
                  <div>
                    <h3 className="text-2xl font-black text-white">{selectedRoom} Devices</h3>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Devices</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDevice((current) => !current)}
                  className="flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-4 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
                >
                  <Plus className="h-4 w-4" />
                  Add Device
                </button>
              </div>

              {showAddDevice && (
                <form
                  onSubmit={addDevice}
                  className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#202126] p-4 md:grid-cols-[minmax(0,1fr)_160px_130px_130px_auto]"
                >
                  <input
                    value={newDevice.name}
                    onChange={(event) => setNewDevice((current) => ({ ...current, name: event.target.value }))}
                    placeholder={`${selectedRoom} device name`}
                    className="min-h-[42px] rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
                  />
                  <select
                    value={newDevice.type}
                    onChange={(event) => setNewDevice((current) => ({ ...current, type: event.target.value }))}
                    className="min-h-[42px] rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-sky-300/40"
                  >
                    <option>Appliance</option>
                    <option>HVAC</option>
                    <option>Vehicle</option>
                    <option>Outdoor</option>
                  </select>
                  <select
                    value={newDevice.status}
                    onChange={(event) => setNewDevice((current) => ({ ...current, status: event.target.value }))}
                    className="min-h-[42px] rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-sky-300/40"
                  >
                    <option>OFF</option>
                    <option>ON</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={newDevice.power_draw_w}
                    onChange={(event) => setNewDevice((current) => ({ ...current, power_draw_w: event.target.value }))}
                    className="min-h-[42px] rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-sky-300/40"
                    aria-label="Power draw watts"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] rounded-xl bg-sky-400 px-4 text-sm font-black text-slate-950 transition hover:bg-sky-300"
                  >
                    Save
                  </button>
                </form>
              )}

              <motion.div layout className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredDevices.map((device, index) => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      index={index}
                      onToggle={toggleDevice}
                      onDelete={deleteDevice}
                      roomColor={selectedRoomColor}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>

            <PageGrootInsight
              page="Smart Control"
              data={{
                selectedRoom,
                selectedRoomDevices: filteredDevices,
                activeDevices,
                totalWatts,
                leakDevices,
              }}
            />
          </>
        )}
      </div>

      <style>{`
        .glass-shell {
          backdrop-filter: blur(34px);
          -webkit-backdrop-filter: blur(34px);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.5); border-radius: 999px; }
      `}</style>
    </div>
  );
};

export default SmartControl;
