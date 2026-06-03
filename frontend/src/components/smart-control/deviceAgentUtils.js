import { Bath, Bed, Coffee, Tv } from 'lucide-react';

export const rooms = [
  { name: 'Living Room', icon: Tv, color: '#f97316' },
  { name: 'Kitchen', icon: Coffee, color: '#3b82f6' },
  { name: 'Bedroom', icon: Bed, color: '#8b5cf6' },
  { name: 'Bathroom', icon: Bath, color: '#ff4d45' },
];

export const getDefaultPower = (device) => {
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

export const getDeviceRoom = (device) => {
  const name = device.name.toLowerCase();
  if (name.includes('kitchen') || name.includes('refrigerator') || name.includes('fridge') || name.includes('dishwasher') || name.includes('coffee') || name.includes('oven')) return 'Kitchen';
  if (name.includes('bedroom') || name.includes('bedside')) return 'Bedroom';
  if (name.includes('bathroom') || name.includes('water heater')) return 'Bathroom';
  return 'Living Room';
};

export const getCommandAction = (text) => {
  const lower = text.toLowerCase();
  if (/\bto\s+off\b/.test(lower)) return 'OFF';
  if (/\bto\s+on\b/.test(lower)) return 'ON';
  if (/\b(turn|switch|power)\s+(it|them|those|that|this|same|previous|last)\s+off\b/.test(lower)) return 'OFF';
  if (/\b(turn|switch|power)\s+(it|them|those|that|this|same|previous|last)\s+on\b/.test(lower)) return 'ON';
  if (/\b(turn|switch|power)\s+off\b/.test(lower)) return 'OFF';
  if (/\b(turn|switch|power)\s+on\b/.test(lower)) return 'ON';
  if (/^\s*(please\s+)?off\s*$/i.test(text)) return 'OFF';
  if (/^\s*(please\s+)?on\s*$/i.test(text)) return 'ON';

  const targetThenState = /\b(ac|air\s*conditioner|air\s*conditioning|lights?|lamps?|fans?|heaters?|charger|tv|washing machine|refrigerator|water heater)\b.*\b(on|off)\b/.exec(lower);
  if (targetThenState) return targetThenState[2].toUpperCase();

  const stateThenTarget = /\b(on|off)\b.*\b(ac|air\s*conditioner|air\s*conditioning|lights?|lamps?|fans?|heaters?|charger|tv|washing machine|refrigerator|water heater)\b/.exec(lower);
  if (stateThenTarget) return stateThenTarget[1].toUpperCase();

  return null;
};

export const extractRequestedDeviceName = (text) => text
  .replace(/\b(turn|switch|power|please|can you|groot|device|control|schedule)\b/gi, ' ')
  .replace(/\b(on|off)\b/gi, ' ')
  .replace(/\bin\s+\d+\s*(second|seconds|sec|secs|s|minute|minutes|min|mins|m)\b/gi, ' ')
  .replace(/\bat\s*\d{1,2}(?::\d{2})?\s*(am|pm)\b/gi, ' ')
  .replace(/\b(living room|kitchen|bedroom|bathroom)\b/gi, ' ')
  .replace(/[^a-z0-9 ]/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const inferDeviceType = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('ac') || lower.includes('fan') || lower.includes('heater')) return 'HVAC';
  if (lower.includes('charger') || lower.includes('ev')) return 'Vehicle';
  if (lower.includes('pump')) return 'Outdoor';
  return 'Appliance';
};

export const isAddableSmartDeviceName = (name) =>
  /\b(ac|air\s*conditioner|air\s*conditioning|light|lamp|fan|heater|charger|ev|tv|television|washing machine|washer|refrigerator|fridge|water heater|dishwasher|oven|coffee maker|pump|humidifier|dehumidifier|air purifier|thermostat|smart plug)\b/i.test(name);

const formatINRSimple = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount);

export const getSavingsInsight = (device, action) => {
  if (action !== 'OFF') return null;
  const watts = Number(device.power_draw_w || device.default_power_w || getDefaultPower(device));
  if (!watts) return null;
  return `${device.name} OFF - you saved approx ${formatINRSimple((watts / 1000) * 12)} per hour while it stays off.`;
};

export const isDeviceControlCommand = (text) => {
  const lower = text.toLowerCase();
  return /^\s*(please\s+)?(on|off)\s*$/i.test(text)
    || /\b(turn|switch|power|toggle)\b/.test(lower)
    || /\bschedule\b/.test(lower)
    || /\bcontrol\b/.test(lower)
    || /\bdevices?\b/.test(lower)
    || /\bappliances?\b/.test(lower)
    || /\bac\b|\bair\s*conditioner\b|\bair\s*conditioning\b|\blights?\b|\blamps?\b|\bfans?\b|\bheaters?\b|\bcharger\b|\btv\b|\bwashing machine\b|\brefrigerator\b|\bwater heater\b/.test(lower);
};

export const isDeviceStatusCommand = (text) =>
  /\b(status|state|running|active|on or off)\b/i.test(text);

export const isPreviousDeviceReference = (text) =>
  /\b(it|them|those|that|this|same|previous|last)\b/i.test(text)
  || /^\s*(please\s+)?(turn|switch|power)\s+(on|off)\s*$/i.test(text)
  || /^\s*(on|off)\s*$/i.test(text);

export const getCommandSchedule = (text) => {
  const relativeMatch = text.match(/\bin\s+(\d+)\s*(second|seconds|sec|secs|s|minute|minutes|min|mins|m)\b/i);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const isMinute = unit.startsWith('m');
    const unitLabel = isMinute
      ? `minute${amount === 1 ? '' : 's'}`
      : `second${amount === 1 ? '' : 's'}`;

    return {
      label: `in ${amount} ${unitLabel}`,
      delayMs: amount * (isMinute ? 60 : 1) * 1000,
    };
  }

  const clockMatch = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!clockMatch) return null;

  const hourText = clockMatch[1];
  const minuteText = clockMatch[2] || '00';
  const meridiem = clockMatch[3].toUpperCase();
  const targetDate = new Date();
  let hour = Number(hourText) % 12;
  if (meridiem === 'PM') hour += 12;
  targetDate.setHours(hour, Number(minuteText), 0, 0);
  if (targetDate.getTime() <= Date.now()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return {
    label: `at ${hourText}:${minuteText} ${meridiem}`,
    delayMs: targetDate.getTime() - Date.now(),
  };
};

const normalizeDeviceName = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const isAcDeviceName = (name) => /\bac\b|\bair\s*conditioner\b|\bair\s*conditioning\b/i.test(name);

const getDeviceKind = (device) => {
  const name = device.name.toLowerCase();
  if (isAcDeviceName(name)) return 'AC';
  if (name.includes('light') || name.includes('lamp')) return 'light';
  if (name.includes('fan')) return 'fan';
  if (name.includes('heater')) return 'heater';
  if (name.includes('tv')) return 'TV';
  if (name.includes('charger')) return 'charger';
  return device.type || 'device';
};

export const getAmbiguousDeviceKind = (text, matches) => {
  const lower = text.toLowerCase();
  if (/\b(ac|air\s*conditioner|air\s*conditioning)\b/.test(lower)) return 'AC';
  if (/\blights?\b|\blamps?\b/.test(lower)) return 'light';
  if (/\bfans?\b/.test(lower)) return 'fan';
  if (/\bheaters?\b/.test(lower)) return 'heater';
  if (/\btv\b|\btelevision\b/.test(lower)) return 'TV';

  const kinds = [...new Set(matches.map(getDeviceKind))];
  return kinds.length === 1 ? kinds[0] : 'device';
};

export const getRoomOptionText = (room, kind, count) => {
  if (kind === 'AC') return `${room} AC`;
  if (kind === 'TV') return `${room} TV`;
  if (kind === 'device') return room;
  return count > 1 ? `${room} ${kind}s` : `${room} ${kind}`;
};

export const findCommandMatches = (devices, text) => {
  const lower = text.toLowerCase();
  const normalizedText = normalizeDeviceName(text);

  const matches = devices.filter((device) => {
    const name = device.name.toLowerCase();
    const compactName = normalizeDeviceName(device.name);
    const words = name.split(/\s+/).filter(Boolean);
    const lastWord = words[words.length - 1];
    const aliases = [
      name,
      compactName,
      lastWord,
      device.type?.toLowerCase(),
    ].filter(Boolean);

    if (/\b(ac|air\s*conditioner|air\s*conditioning)\b/.test(lower) && isAcDeviceName(name)) {
      return true;
    }

    if (/\blights?\b/.test(lower) && (name.includes('light') || name.includes('lamp'))) {
      return true;
    }

    if (words.some((word) => word.length > 1 && lower.includes(word))) {
      return true;
    }

    return aliases.some((alias) =>
      alias.length > 1 && (lower.includes(alias) || normalizedText.includes(alias.replace(/[^a-z0-9]/g, '')))
    );
  });

  const uniqueMatches = [...new Map(matches.map((device) => [device.id, device])).values()];
  return uniqueMatches.sort((a, b) => b.name.length - a.name.length);
};

export const pickBestCommandMatch = (matches, text, selectedRoom) => {
  const lower = text.toLowerCase();
  const roomMatch = matches.find((device) => lower.includes(device.room?.toLowerCase()));
  if (roomMatch) return roomMatch;
  const selectedRoomMatch = matches.find((device) => device.room === selectedRoom);
  return selectedRoomMatch || matches[0];
};

const getCommandRoom = (text) => {
  const lower = text.toLowerCase();
  return rooms.find((room) => lower.includes(room.name.toLowerCase()))?.name || null;
};

const getSourceStateFilter = (text, action) => {
  const lower = text.toLowerCase();
  if (/\b(all|every)\s+(on|active|running)\s+(devices?|appliances?)\b|\bdevices?\s+(which|that|currently)?\s*(are|is|in)?\s*(the\s*)?on\b|\bin\s+on\s+state\b/.test(lower)) {
    return 'ON';
  }
  if (/\b(all|every)\s+(off|offline)\s+(devices?|appliances?)\b|\bdevices?\s+(which|that|currently)?\s*(are|is|in)?\s*(the\s*)?off\b|\bin\s+off\s+state\b/.test(lower)) {
    return 'OFF';
  }
  return action === 'OFF' ? 'ON' : 'OFF';
};

export const getBulkCommandRequest = (text, devices, action, forcedRoom) => {
  const lower = text.toLowerCase();
  const explicitAll = /\b(all|every)\b/.test(lower);
  const genericPluralDevices = /\b(devices|appliances)\b/.test(lower);
  const roomBulk = /\bdevices?\s+in\s+(living room|kitchen|bedroom|bathroom)\b/.test(lower)
    || /\b(living room|kitchen|bedroom|bathroom)\s+devices?\b/.test(lower);
  const isBulk = explicitAll || genericPluralDevices || roomBulk;

  if (!isBulk || !action) return null;

  const requestedRoom = forcedRoom !== undefined ? forcedRoom : getCommandRoom(text);
  const sourceState = getSourceStateFilter(text, action);
  const scopeDevices = requestedRoom
    ? devices.filter((device) => device.room === requestedRoom)
    : devices;
  const targetDevices = scopeDevices.filter((device) => {
    const currentState = device.is_on ? 'ON' : 'OFF';
    return currentState === sourceState && currentState !== action;
  });

  return {
    action,
    room: requestedRoom,
    sourceState,
    scopeCount: scopeDevices.length,
    devices: targetDevices,
    needsScopeChoice: !requestedRoom && !explicitAll && genericPluralDevices,
    label: requestedRoom ? `${requestedRoom} devices` : 'all devices',
  };
};
