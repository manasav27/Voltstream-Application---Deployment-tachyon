import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Bell,
  Bot,
  CalendarClock,
  CheckCircle2,
  HelpCircle,
  Plus,
  Power,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageGrootInsight from '../components/PageGrootInsight';
import FormattedMessage from '../components/chat/FormattedMessage';
import { DeviceCard, ProactiveLeakDetector, SummaryCard } from '../components/smart-control/DeviceWidgets';
import {
  extractRequestedDeviceName,
  findCommandMatches,
  getAmbiguousDeviceKind,
  getBulkCommandRequest,
  getCommandAction,
  getCommandSchedule,
  getDefaultPower,
  getDeviceRoom,
  getRoomOptionText,
  getSavingsInsight,
  inferDeviceType,
  isAddableSmartDeviceName,
  isDeviceControlCommand,
  isDeviceStatusCommand,
  isPreviousDeviceReference,
  pickBestCommandMatch,
  rooms,
} from '../components/smart-control/deviceAgentUtils';

const LOCAL_API_BASE = 'http://127.0.0.1:8000/api/v1';
const DEPLOYED_API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_BASE : DEPLOYED_API_BASE);

const DeviceAgentCommandBar = ({ devices, selectedRoom, onExecuteCommand, onAddDevice }) => {
  const [command, setCommand] = useState('');
  const [agentState, setAgentState] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [undoAction, setUndoAction] = useState(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(0);
  const inputRef = useRef(null);
  const scheduledTimersRef = useRef([]);
  const undoTimerRef = useRef(null);
  const lastDeviceRef = useRef(null);
  const lastBulkActionRef = useRef(null);

  useEffect(() => () => {
    scheduledTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    clearInterval(undoTimerRef.current);
  }, []);

  const getAgentFinalData = (payload) => {
    if (typeof payload !== 'string') return payload?.data || payload;

    const events = payload
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const errorEvent = events.find((event) => event.event === 'error');
    if (errorEvent) throw new Error(errorEvent.detail || 'Agent command failed.');

    return [...events].reverse().find((event) => event.event === 'final')?.data;
  };

  const runAgentCommand = async (message) => {
    const response = await axios.post(`${API_BASE}/agent`, { message });
    return getAgentFinalData(response.data);
  };

  const executeDeviceAction = async (device, action, nextState) => {
    setIsExecuting(true);
    try {
      const previousStatus = device.is_on ? 'ON' : 'OFF';
      const updatedDevice = await onExecuteCommand(device.id, action);
      const actedDevice = updatedDevice || device;
      lastDeviceRef.current = actedDevice;
      setAgentState({
        type: 'done',
        command,
        device: actedDevice,
        action,
        message: `${device.name} turned ${action}`,
        insight: getSavingsInsight(device, action),
        detail: nextState?.detail,
      });

      startUndoTimer({
        device: actedDevice,
        previousStatus,
        command,
      });
    } catch (error) {
      setAgentState({
        type: 'error',
        command,
        message: `Couldn't update ${device.name}. Please try again.`,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const startUndoTimer = (nextUndoAction) => {
    clearInterval(undoTimerRef.current);
    setUndoAction(nextUndoAction);
    setUndoSecondsLeft(5);
    undoTimerRef.current = setInterval(() => {
      setUndoSecondsLeft((seconds) => {
        if (seconds <= 1) {
          clearInterval(undoTimerRef.current);
          setUndoAction(null);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
  };

  const executeBulkDeviceAction = async (bulkRequest, commandText) => {
    setIsExecuting(true);
    try {
      const previousStates = bulkRequest.devices.map((device) => ({
        originalDevice: device,
        previousStatus: device.is_on ? 'ON' : 'OFF',
      }));
      const agentMessage = bulkRequest.room ? `${commandText} in ${bulkRequest.room}` : commandText;
      const agentResult = await runAgentCommand(agentMessage);
      const agentDevices = agentResult?.devices || (agentResult?.device ? [agentResult.device] : []);
      const updatedDevicesById = new Map(agentDevices.map((device) => [device.id, device]));
      const updates = previousStates.map(({ originalDevice, previousStatus }) => {
        const updatedDevice = updatedDevicesById.get(originalDevice.id) || {
          ...originalDevice,
          status: bulkRequest.action,
          power_draw_w: bulkRequest.action === 'OFF' ? 0 : getDefaultPower(originalDevice),
        };
        const hydratedDevice = {
          ...originalDevice,
          ...updatedDevice,
          room: updatedDevice.room || originalDevice.room || getDeviceRoom(updatedDevice),
          is_on: updatedDevice.status === 'ON',
          power_draw_kw: updatedDevice.power_draw_w ? updatedDevice.power_draw_w / 1000 : 0,
        };
        window.dispatchEvent(new CustomEvent('voltstream-device-updated', { detail: hydratedDevice }));
        return {
          originalDevice,
          previousStatus,
          updatedDevice: hydratedDevice,
        };
      });
      const rememberedBulkDevices = updates.map(({ originalDevice, updatedDevice }) => updatedDevice || originalDevice);
      lastBulkActionRef.current = {
        type: 'bulk',
        action: bulkRequest.action,
        label: bulkRequest.label,
        sourceState: bulkRequest.sourceState,
        devices: rememberedBulkDevices,
      };

      setAgentState({
        type: 'done',
        command: commandText,
        action: bulkRequest.action,
        message: agentResult?.answer || `${updates.length} ${bulkRequest.label} turned ${bulkRequest.action}`,
        detail: `${bulkRequest.sourceState} devices only`,
      });

      window.dispatchEvent(new CustomEvent('voltstream-page-insight-alert', {
        detail: {
          page: 'Smart Control',
          action: bulkRequest.action,
          scope: bulkRequest.label,
          count: updates.length,
          message: `${updates.length} ${bulkRequest.label} turned ${bulkRequest.action}`,
          devices: updates.map(({ originalDevice, updatedDevice }) => ({
            id: (updatedDevice || originalDevice).id,
            name: (updatedDevice || originalDevice).name,
            type: (updatedDevice || originalDevice).type,
          })),
          suggestion: bulkRequest.action === 'OFF'
            ? 'Suggestion: Keep essential devices like the refrigerator online if needed, and use this low-load window to save on standby power.'
            : 'Suggestion: Turning many devices on together can spike demand and increase your bill. Consider switching high-power appliances on one at a time.',
        },
      }));

      startUndoTimer({
        type: 'bulk',
        devices: updates.map(({ originalDevice, previousStatus, updatedDevice }) => ({
          device: updatedDevice || originalDevice,
          previousStatus,
        })),
        command: commandText,
      });
    } catch (error) {
      setAgentState({
        type: 'error',
        command: commandText,
        message: `Couldn't update ${bulkRequest.label}. Please try again.`,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const openBulkConfirmation = (bulkRequest, commandText) => {
    if (bulkRequest.scopeCount === 0) {
      setAgentState({
        type: 'error',
        command: commandText,
        message: `No ${bulkRequest.label} were found.`,
      });
      return;
    }

    if (bulkRequest.devices.length === 0) {
      setAgentState({
        type: 'done',
        command: commandText,
        action: bulkRequest.action,
        message: `${bulkRequest.label} are already ${bulkRequest.action}`,
        detail: `${bulkRequest.sourceState} devices only`,
      });
      return;
    }

    setAgentState({
      type: 'bulkConfirm',
      command: commandText,
      action: bulkRequest.action,
      bulkRequest,
      message: `Turn ${bulkRequest.action} ${bulkRequest.devices.length} ${bulkRequest.label}?`,
      detail: `${bulkRequest.sourceState} devices only`,
    });
  };

  const executeBulkScopeChoice = (room) => {
    if (!agentState?.command || !agentState?.action) return;
    const bulkRequest = getBulkCommandRequest(agentState.command, devices, agentState.action, room);
    if (!bulkRequest) return;
    openBulkConfirmation(bulkRequest, agentState.command);
  };

  const confirmBulkAction = async () => {
    if (!agentState?.bulkRequest) return;
    await executeBulkDeviceAction(agentState.bulkRequest, agentState.command);
  };

  const confirmPreviousBulkAction = async () => {
    if (!agentState?.bulkMemory || !agentState?.action || isExecuting) return;

    setIsExecuting(true);
    try {
      const bulkMemory = agentState.bulkMemory;
      const previousStates = bulkMemory.devices.map((device) => {
        const currentDevice = devices.find((item) => item.id === device.id) || device;
        return {
          device: currentDevice,
          previousStatus: currentDevice.is_on ? 'ON' : currentDevice.status || 'OFF',
        };
      });
      const devicesToUpdate = previousStates.filter(({ previousStatus }) => previousStatus !== agentState.action);
      if (devicesToUpdate.length === 0) {
        setAgentState({
          type: 'done',
          command: agentState.command,
          action: agentState.action,
          message: `Yes, those ${bulkMemory.label} have been turned ${agentState.action}.`,
          detail: 'previous group already matched',
        });
        return;
      }

      const restoredDevices = await Promise.all(
        devicesToUpdate.map(({ device }) => onExecuteCommand(device.id, agentState.action))
      );
      const updatedById = new Map(
        restoredDevices.map((updatedDevice, index) => [
          (updatedDevice || devicesToUpdate[index].device).id,
          updatedDevice || devicesToUpdate[index].device,
        ])
      );
      const rememberedDevices = previousStates.map(({ device }) =>
        updatedById.get(device.id) || device
      );

      lastBulkActionRef.current = {
        ...bulkMemory,
        action: agentState.action,
        devices: rememberedDevices,
      };

      setAgentState({
        type: 'done',
        command: agentState.command,
        action: agentState.action,
        message: `${rememberedDevices.length} ${bulkMemory.label} turned ${agentState.action}`,
        detail: 'previous group selected',
      });

      startUndoTimer({
        type: 'bulk',
        devices: devicesToUpdate.map(({ device, previousStatus }) => ({
          device: updatedById.get(device.id) || device,
          previousStatus,
        })),
        command: agentState.command,
      });
    } catch (error) {
      setAgentState({
        type: 'error',
        command: agentState.command,
        message: "Couldn't update the previous device group. Please try again.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const undoLastAction = async () => {
    if (!undoAction || isExecuting) return;

    clearInterval(undoTimerRef.current);
    setIsExecuting(true);
    try {
      if (undoAction.type === 'bulk') {
        const restoredDevices = await Promise.all(
          undoAction.devices.map(({ device, previousStatus }) =>
            onExecuteCommand(device.id, previousStatus)
          )
        );

        setAgentState({
          type: 'done',
          command: `Undo: ${undoAction.command}`,
          action: 'UNDO',
          message: `${restoredDevices.length} devices restored`,
          insight: null,
        });
        setUndoAction(null);
        setUndoSecondsLeft(0);
        return;
      }

      const restoredDevice = await onExecuteCommand(undoAction.device.id, undoAction.previousStatus);
      setAgentState({
        type: 'done',
        command: `Undo: ${undoAction.command}`,
        device: restoredDevice || undoAction.device,
        action: undoAction.previousStatus,
        message: `${undoAction.device.name} restored to ${undoAction.previousStatus}`,
        insight: null,
      });
      setUndoAction(null);
      setUndoSecondsLeft(0);
    } catch (error) {
      setAgentState({
        type: 'error',
        command: `Undo: ${undoAction.command}`,
        message: undoAction.type === 'bulk'
          ? 'Couldn\'t undo the bulk update. Please try again.'
          : `Couldn't undo ${undoAction.device.name}. Please try again.`,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const addUnknownDevice = async () => {
    if (!agentState?.deviceName || !agentState?.action || isExecuting) return;

    setIsExecuting(true);
    try {
      const type = inferDeviceType(agentState.deviceName);
      const addedDevice = await onAddDevice({
        name: agentState.deviceName,
        type,
        room: selectedRoom,
        status: agentState.action,
        power_draw_w: getDefaultPower({ name: agentState.deviceName, type }),
      });

      setAgentState({
        type: 'done',
        command,
        device: addedDevice,
        action: agentState.action,
        message: `${addedDevice.name} added and turned ${agentState.action}`,
        insight: getSavingsInsight(addedDevice, agentState.action),
        detail: `${selectedRoom} device`,
      });
      lastDeviceRef.current = addedDevice;
    } catch (error) {
      setAgentState({
        type: 'error',
        command,
        message: `Couldn't add ${agentState.deviceName}. Please try again.`,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const submitCommand = async (event) => {
    event.preventDefault();
    const trimmedCommand = command.trim();
    if (!trimmedCommand || isExecuting) return;

    const action = getCommandAction(trimmedCommand);
    const isStatusRequest = isDeviceStatusCommand(trimmedCommand);
    const schedule = getCommandSchedule(trimmedCommand);
    const matches = findCommandMatches(devices, trimmedCommand);
    const bulkRequest = getBulkCommandRequest(trimmedCommand, devices, action);
    const isPreviousReference = isPreviousDeviceReference(trimmedCommand);
    const isPreviousGroupReference = /\b(them|those)\b/i.test(trimmedCommand);

    if (/^\s*(hi|hello|hey|hii|hai|yo|good\s+(morning|afternoon|evening)|namaste)\s*[!.?]*\s*$/i.test(trimmedCommand)) {
      setAgentState({
        type: 'done',
        command: trimmedCommand,
        message: 'Hi, I am Groot, your device-control agent. I can control your smart devices from here.',
      });
      return;
    }

    if (!isDeviceControlCommand(trimmedCommand)) {
      setIsExecuting(true);
      try {
        const agentResult = await runAgentCommand(trimmedCommand);
        setAgentState({
          type: 'outOfScope',
          command: trimmedCommand,
          message: agentResult?.answer || 'I cannot help with that action. I can only check or control smart devices from this page.',
        });
      } catch (error) {
        setAgentState({
          type: 'error',
          command: trimmedCommand,
          message: "Couldn't reach the device agent. Please try again.",
        });
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (isPreviousGroupReference && action) {
      const previousBulkAction = lastBulkActionRef.current;
      if (!previousBulkAction) {
        setAgentState({
          type: 'error',
          command: trimmedCommand,
          message: "You previously didn't turn any device group on or off in this session.",
        });
        return;
      }
      const rememberedDevices = previousBulkAction.devices.map((device) =>
        devices.find((item) => item.id === device.id) || device
      );
      const devicesToUpdate = rememberedDevices.filter((device) => {
        const currentStatus = device.is_on ? 'ON' : device.status || 'OFF';
        return currentStatus !== action;
      });
      if (devicesToUpdate.length === 0) {
        setAgentState({
          type: 'done',
          command: trimmedCommand,
          action,
          message: `Yes, those ${previousBulkAction.label} have been turned ${action}.`,
          detail: 'previous group already matched',
        });
        return;
      }

      setAgentState({
        type: 'confirmPreviousBulk',
        command: trimmedCommand,
        bulkMemory: {
          ...previousBulkAction,
          devices: rememberedDevices,
        },
        action,
        message: `Do you want me to turn ${action === 'ON' ? 'on' : 'off'} those previously turned ${previousBulkAction.action} ${previousBulkAction.label}?`,
      });
      return;
    }

    if (isPreviousReference && action) {
      const previousDevice = lastDeviceRef.current;
      if (!previousDevice) {
        setAgentState({
          type: 'error',
          command: trimmedCommand,
          message: "You previously didn't turn any device on or off in this session.",
        });
        return;
      }

      setAgentState({
        type: 'confirmPrevious',
        command: trimmedCommand,
        device: previousDevice,
        action,
        message: `Do you want me to turn ${action === 'ON' ? 'on' : 'off'} the previous device, ${previousDevice.name}?`,
      });
      return;
    }

    if (isStatusRequest && !action) {
      setIsExecuting(true);
      try {
        const agentResult = await runAgentCommand(trimmedCommand);
        const statusDevice = agentResult?.device;
        if (statusDevice) {
          lastDeviceRef.current = statusDevice;
        }
        const fallbackMessage = statusDevice
          ? `${statusDevice.name} is ${statusDevice.status} and drawing ${statusDevice.power_draw_w} W.`
          : 'I checked the device status.';

        setAgentState({
          type: 'done',
          command: trimmedCommand,
          device: statusDevice,
          action: 'STATUS',
          message: agentResult?.answer || fallbackMessage,
        });
      } catch (error) {
        setAgentState({
          type: 'error',
          command: trimmedCommand,
          message: "Couldn't get that device status. Please try again.",
        });
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (!action) {
      setAgentState({
        type: 'clarify',
        command: trimmedCommand,
        message: 'Which device should Groot control?',
        devices: devices.slice(0, 4),
        action: action || 'OFF',
      });
      return;
    }

    if (bulkRequest) {
      if (schedule) {
        setAgentState({
          type: 'error',
          command: trimmedCommand,
          message: 'Bulk scheduling is not available yet. Run the bulk command now instead.',
        });
        return;
      }

      if (bulkRequest.needsScopeChoice) {
        setAgentState({
          type: 'bulkScope',
          command: trimmedCommand,
          action,
          message: `Turn ${action} which devices?`,
          detail: `${bulkRequest.sourceState} devices only`,
          rooms: rooms.map((room) => room.name),
        });
        return;
      }

      openBulkConfirmation(bulkRequest, trimmedCommand);
      return;
    }

    if (matches.length === 0) {
      const deviceName = extractRequestedDeviceName(trimmedCommand);
      const previousDevice = lastDeviceRef.current;
      if (previousDevice && isPreviousReference) {
        setAgentState({
          type: 'confirmPrevious',
          command: trimmedCommand,
          device: previousDevice,
          action,
          message: `Do you want me to turn ${action === 'ON' ? 'on' : 'off'} the previous device, ${previousDevice.name}?`,
        });
        return;
      }

      if (!isAddableSmartDeviceName(deviceName)) {
        setAgentState({
          type: 'outOfScope',
          command: trimmedCommand,
          message: `I couldn't find "${deviceName || 'that'}" as a smart device. Please check the device name and try again.`,
        });
        return;
      }

      setAgentState({
        type: 'unknownDevice',
        command: trimmedCommand,
        deviceName: deviceName || 'that device',
        action,
        message: `We don't have ${deviceName || 'that device'} in your devices list.`,
      });
      return;
    }

    const actionableMatches = matches.filter((device) =>
      action === 'OFF' ? device.is_on : !device.is_on
    );

    if (actionableMatches.length === 0) {
      const ambiguousKind = getAmbiguousDeviceKind(trimmedCommand, matches);
      setAgentState({
        type: 'done',
        command: trimmedCommand,
        action,
        message: `All matching ${ambiguousKind}${matches.length === 1 || ambiguousKind === 'AC' ? '' : 's'} are already ${action}`,
      });
      return;
    }

    const commandMatches = actionableMatches;
    const uniqueRooms = [...new Set(commandMatches.map((device) => device.room).filter(Boolean))];
    const lowerCommand = trimmedCommand.toLowerCase();
    const ambiguousKind = getAmbiguousDeviceKind(trimmedCommand, commandMatches);
    const roomWasNamed = uniqueRooms.some((room) => lowerCommand.includes(room.toLowerCase()));
    const shouldClarifyRoom = commandMatches.length > 1
      && uniqueRooms.length > 1
      && !roomWasNamed
      && (
        /\b(ac|air\s*conditioner|air\s*conditioning)\b/.test(lowerCommand)
        || /\blights?\b|\blamps?\b/.test(lowerCommand)
        || /\bfans?\b/.test(lowerCommand)
        || /\bheaters?\b/.test(lowerCommand)
      );
    const isGenericLightsCommand = /\blights?\b/.test(lowerCommand)
      && !uniqueRooms.some((room) => trimmedCommand.toLowerCase().includes(room.toLowerCase()));

    if (shouldClarifyRoom || (commandMatches.length > 1 && isGenericLightsCommand)) {
      const firstRoom = uniqueRooms[0] || 'This room';
      const firstRoomCount = commandMatches.filter((device) => device.room === firstRoom).length;
      setAgentState({
        type: 'clarify',
        command: trimmedCommand,
        message: ambiguousKind === 'AC' ? 'Which AC should Groot control?' : 'Which room?',
        detail: `${firstRoom} has ${firstRoomCount} matching ${ambiguousKind}${firstRoomCount === 1 || ambiguousKind === 'AC' ? '' : 's'}`,
        rooms: uniqueRooms,
        matches: commandMatches,
        action,
        schedule,
        ambiguousKind,
      });
      return;
    }

    const device = pickBestCommandMatch(commandMatches, trimmedCommand, selectedRoom);

    if (schedule) {
      setAgentState({
        type: 'schedule',
        command: trimmedCommand,
        device,
        action,
        schedule,
        message: `Schedule ${device.name} ${action === 'ON' ? 'on' : 'off'} ${schedule.label}?`,
      });
      return;
    }

    await executeDeviceAction(device, action);
  };

  const confirmPreviousDevice = async () => {
    if (!agentState?.device || !agentState?.action) return;
    const currentDevice = devices.find((device) => device.id === agentState.device.id) || agentState.device;
    await executeDeviceAction(currentDevice, agentState.action, {
      detail: 'previous device selected',
    });
  };

  const executeRoomChoice = async (room) => {
    const currentState = agentState;
    const roomDevices = currentState.matches?.filter((device) => device.room === room) || [];
    const device = roomDevices[0];
    if (!device) return;

    if (currentState.schedule) {
      setAgentState({
        type: 'schedule',
        command: currentState.command,
        device,
        action: currentState.action,
        schedule: currentState.schedule,
        message: `Schedule ${device.name} ${currentState.action === 'ON' ? 'on' : 'off'} ${currentState.schedule.label}?`,
      });
      return;
    }

    await executeDeviceAction(device, currentState.action, {
      detail: `${room} selected`,
    });
  };

  const executeDeviceChoice = async (device) => {
    if (agentState.schedule) {
      setAgentState({
        type: 'schedule',
        command: agentState.command,
        device,
        action: agentState.action,
        schedule: agentState.schedule,
        message: `Schedule ${device.name} ${agentState.action === 'ON' ? 'on' : 'off'} ${agentState.schedule.label}?`,
      });
      return;
    }

    await executeDeviceAction(device, agentState.action);
  };

  const confirmSchedule = () => {
    if (!agentState?.device) return;

    const scheduledCommand = agentState.command;
    const scheduledDevice = agentState.device;
    const scheduledAction = agentState.action;
    const scheduledLabel = agentState.schedule.label;
    const delayMs = Math.max(agentState.schedule.delayMs, 0);

    const timerId = setTimeout(() => {
      onExecuteCommand(scheduledDevice.id, scheduledAction).catch((error) => {
        console.error('Failed to run scheduled command:', error);
      });
      scheduledTimersRef.current = scheduledTimersRef.current.filter((id) => id !== timerId);
    }, delayMs);

    scheduledTimersRef.current = [...scheduledTimersRef.current, timerId];
    setAgentState({
      type: 'scheduled',
      command: scheduledCommand,
      device: scheduledDevice,
      action: scheduledAction,
      message: `${scheduledDevice.name} will turn ${scheduledAction} ${scheduledLabel}`,
    });
  };

  return (
    <section className="rounded-2xl border border-orange-400/70 bg-[#101116] p-3 shadow-[0_0_26px_rgba(249,115,22,0.16)]">
      <form
        onSubmit={submitCommand}
        className="flex min-h-[58px] items-center gap-3 rounded-xl border border-orange-400/70 bg-[#1b1c2d] px-4"
      >
          <Bot className="h-5 w-5 shrink-0 text-orange-400" />
          <input
            ref={inputRef}
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Ask Groot to control devices..."
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-400"
          />
          <span className="hidden text-sm text-slate-500 md:inline">press Enter anytime</span>
          <button
            type="submit"
            disabled={isExecuting}
            aria-label="Send command"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-500 text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
          </button>
      </form>

      <AnimatePresence mode="wait">
        {agentState && (
          <motion.div
            key={`${agentState.type}-${agentState.command}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3"
          >
            <div className="rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300">
              <span className="mr-2 text-orange-400">&gt;</span>
              "{agentState.command}"
            </div>

            {agentState.type === 'done' && (
              <>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <div>
                    <FormattedMessage text={agentState.message} isUser={false} />
                    {agentState.detail && <span className="ml-2 font-semibold text-emerald-100/70">({agentState.detail})</span>}
                  </div>
                </div>

                {agentState.insight && (
                  <div className="mt-3 rounded-xl border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-sm font-black text-violet-200">
                    <FormattedMessage text={agentState.insight} isUser={false} />
                  </div>
                )}

                {undoAction && undoSecondsLeft > 0 && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#22223a]">
                    <div className="flex min-h-[58px] items-center justify-between gap-3 px-4">
                      <span className="text-sm font-semibold text-slate-400">Changed your mind?</span>
                      <button
                        type="button"
                        onClick={undoLastAction}
                        disabled={isExecuting}
                        className="rounded-lg px-3 py-2 text-sm font-black text-orange-300 transition hover:bg-orange-400/10 disabled:cursor-wait disabled:opacity-60"
                      >
                        Undo ({undoSecondsLeft}s)
                      </button>
                    </div>
                    <div className="h-1 bg-white/8">
                      <div
                        className="h-full bg-orange-400 transition-all duration-1000"
                        style={{ width: `${(undoSecondsLeft / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {agentState.type === 'schedule' && (
              <div className="mt-3">
                <div className="rounded-xl border border-sky-400/50 bg-sky-400/10 px-3 py-2 text-sm font-black text-sky-200">
                  <CalendarClock className="mr-2 inline h-4 w-4" />
                  {agentState.message}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={confirmSchedule}
                    disabled={isExecuting}
                    className="min-h-[36px] rounded-lg bg-sky-400 px-5 text-sm font-black text-slate-950 transition hover:bg-sky-300 disabled:cursor-wait disabled:opacity-60"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentState(null)}
                    className="min-h-[36px] rounded-lg border border-white/10 px-5 text-sm font-black text-slate-400 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {agentState.type === 'scheduled' && (
              <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-300">
                <CalendarClock className="mr-2 inline h-4 w-4" />
                {agentState.message}
              </div>
            )}

            {agentState.type === 'bulkScope' && (
              <div className="mt-3">
                <div className="rounded-xl border border-orange-400/60 bg-orange-400/10 px-3 py-2 text-sm font-black text-orange-300">
                  <HelpCircle className="mr-2 inline h-4 w-4" />
                  {agentState.message}
                  {agentState.detail && <span className="ml-2 text-orange-100/70">{agentState.detail}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => executeBulkScopeChoice(null)}
                    disabled={isExecuting}
                    className="min-h-[34px] rounded-lg border border-orange-400/60 bg-orange-400/10 px-3 text-sm font-black text-orange-200 transition hover:bg-orange-400/20 disabled:cursor-wait disabled:opacity-60"
                  >
                    All devices
                  </button>
                  {agentState.rooms?.map((room) => (
                    <button
                      key={room}
                      type="button"
                      onClick={() => executeBulkScopeChoice(room)}
                      disabled={isExecuting}
                      className="min-h-[34px] rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-slate-300 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {agentState.type === 'bulkConfirm' && (
              <div className="mt-3">
                <div className="rounded-xl border border-orange-400/60 bg-orange-400/10 px-3 py-2 text-sm font-black text-orange-300">
                  <HelpCircle className="mr-2 inline h-4 w-4" />
                  {agentState.message}
                  {agentState.detail && <span className="ml-2 text-orange-100/70">{agentState.detail}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={confirmBulkAction}
                    disabled={isExecuting}
                    className="min-h-[36px] rounded-lg bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentState(null)}
                    className="min-h-[36px] rounded-lg border border-white/10 px-4 text-sm font-black text-slate-400 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {agentState.type === 'confirmPrevious' && (
              <div className="mt-3">
                <div className="rounded-xl border border-orange-400/60 bg-orange-400/10 px-3 py-2 text-sm font-black text-orange-300">
                  <HelpCircle className="mr-2 inline h-4 w-4" />
                  {agentState.message}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={confirmPreviousDevice}
                    disabled={isExecuting}
                    className="min-h-[36px] rounded-lg bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    Yes, do it
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentState(null)}
                    className="min-h-[36px] rounded-lg border border-white/10 px-4 text-sm font-black text-slate-400 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {agentState.type === 'confirmPreviousBulk' && (
              <div className="mt-3">
                <div className="rounded-xl border border-orange-400/60 bg-orange-400/10 px-3 py-2 text-sm font-black text-orange-300">
                  <HelpCircle className="mr-2 inline h-4 w-4" />
                  {agentState.message}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={confirmPreviousBulkAction}
                    disabled={isExecuting}
                    className="min-h-[36px] rounded-lg bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    Yes, do it
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentState(null)}
                    className="min-h-[36px] rounded-lg border border-white/10 px-4 text-sm font-black text-slate-400 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {agentState.type === 'clarify' && (
              <div className="mt-3">
                <div className="rounded-xl border border-orange-400/60 bg-orange-400/10 px-3 py-2 text-sm font-black text-orange-300">
                  <HelpCircle className="mr-2 inline h-4 w-4" />
                  {agentState.message}
                  {agentState.detail && <span className="ml-2 text-orange-100/70">{agentState.detail}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agentState.rooms?.map((room) => (
                    (() => {
                      const roomMatchCount = agentState.matches?.filter((device) => device.room === room).length || 0;
                      return (
                    <button
                      key={room}
                      type="button"
                      onClick={() => executeRoomChoice(room)}
                      disabled={isExecuting}
                      className="min-h-[34px] rounded-lg border border-orange-400/60 bg-orange-400/10 px-3 text-sm font-black text-orange-200 transition hover:bg-orange-400/20 disabled:cursor-wait disabled:opacity-60"
                    >
                      {getRoomOptionText(room, agentState.ambiguousKind, roomMatchCount)}
                    </button>
                      );
                    })()
                  ))}
                  {agentState.devices?.map((device) => (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => executeDeviceChoice(device)}
                      disabled={isExecuting}
                      className="min-h-[34px] rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-slate-300 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                    >
                      {device.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {agentState.type === 'unknownDevice' && (
              <div className="mt-3">
                <div className="rounded-xl border border-orange-400/60 bg-orange-400/10 px-3 py-2 text-sm font-black text-orange-300">
                  <HelpCircle className="mr-2 inline h-4 w-4" />
                  {agentState.message} Do you want me to add it?
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addUnknownDevice}
                    disabled={isExecuting}
                    className="min-h-[36px] rounded-lg bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    Yes, add it
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentState(null)}
                    className="min-h-[36px] rounded-lg border border-white/10 px-4 text-sm font-black text-slate-400 transition hover:bg-white/10"
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {agentState.type === 'error' && (
              <div className="mt-3 rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm font-black text-red-200">
                {agentState.message}
              </div>
            )}

            {agentState.type === 'outOfScope' && (
              <div className="mt-3 rounded-xl border border-orange-400/50 bg-orange-400/10 px-3 py-2 text-sm font-black text-orange-200">
                {agentState.message}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
  const [insightWarning, setInsightWarning] = useState(null);
  const [warningPulseId, setWarningPulseId] = useState(0);
  const insightRef = useRef(null);
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

  useEffect(() => {
    const handleInsightAlert = (event) => {
      if (event.detail?.page && event.detail.page !== 'Smart Control') return;
      setInsightWarning(event.detail);
      setWarningPulseId((current) => current + 1);
    };

    window.addEventListener('voltstream-page-insight-alert', handleInsightAlert);
    return () => window.removeEventListener('voltstream-page-insight-alert', handleInsightAlert);
  }, []);

  const openInsightWarning = () => {
    insightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setInsightWarning((current) => current ? { ...current, seen: true } : current);
  };

  const setDeviceStatus = async (id, status) => {
    const deviceToUpdate = devices.find((device) => device.id === id);
    if (!deviceToUpdate) return null;

    const nextStatus = status === 'ON' ? 'ON' : 'OFF';
    const nextIsOn = nextStatus === 'ON';
    const optimisticWatts = nextIsOn ? getDefaultPower(deviceToUpdate) : 0;

    setDevices((prevDevices) => prevDevices.map((device) =>
      device.id === id
        ? {
            ...device,
            is_on: nextIsOn,
            status: nextStatus,
            power_draw_w: optimisticWatts,
            power_draw_kw: optimisticWatts / 1000,
          }
        : device
    ));

    try {
      const res = await axios.patch(`${API_BASE}/devices/${id}?status=${nextStatus}`);
      const persisted = res.data;
      const hydratedDevice = {
        ...deviceToUpdate,
        ...persisted,
        room: persisted.room || deviceToUpdate.room || getDeviceRoom(persisted),
        is_on: persisted.status === 'ON',
        power_draw_kw: persisted.power_draw_w ? persisted.power_draw_w / 1000 : 0,
      };

      setDevices((prevDevices) => prevDevices.map((device) =>
        device.id === id
          ? hydratedDevice
          : device
      ));

      window.dispatchEvent(new CustomEvent('voltstream-device-updated', { detail: hydratedDevice }));
      return hydratedDevice;
    } catch (error) {
      console.error('Failed to persist device state:', error);
      setDevices((prevDevices) => prevDevices.map((device) =>
        device.id === id
          ? {
              ...device,
              is_on: deviceToUpdate.is_on,
              status: deviceToUpdate.status,
              power_draw_w: deviceToUpdate.power_draw_w,
              power_draw_kw: deviceToUpdate.power_draw_kw,
            }
          : device
      ));
      throw error;
    }
  };

  const toggleDevice = async (id) => {
    const deviceToUpdate = devices.find((device) => device.id === id);
    if (!deviceToUpdate) return;

    await setDeviceStatus(id, deviceToUpdate.is_on ? 'OFF' : 'ON');
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

  const addDeviceFromAgent = async ({ name, type, room, status, power_draw_w }) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Device name is required');

    const nextStatus = status === 'ON' ? 'ON' : 'OFF';
    const powerDraw = Math.max(0, Number(power_draw_w) || 100);

    const res = await axios.post(`${API_BASE}/devices`, {
      name: trimmedName,
      type: type || 'Appliance',
      room: room || selectedRoom,
      status: nextStatus,
      power_draw_w: powerDraw,
    });

    const hydrated = hydrateDevice(res.data);
    setDevices((prevDevices) => [...prevDevices, hydrated]);
    window.dispatchEvent(new CustomEvent('voltstream-device-updated', { detail: hydrated }));
    return hydrated;
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
  const SelectedRoomIcon = rooms.find((room) => room.name === selectedRoom)?.icon || rooms[0].icon;
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
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-black text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.16)]">Devices</h2>
            <p className="mt-1 text-sm text-slate-400">Manage and monitor your smart devices</p>
          </div>

          {insightWarning && (
            <button
              type="button"
              onClick={openInsightWarning}
              className="group flex min-h-[44px] items-center gap-3 rounded-full border border-red-300/50 bg-red-500/10 px-3 text-left text-red-100 shadow-[0_0_26px_rgba(248,113,113,0.22)] transition hover:bg-red-500/15"
              aria-label="Open Groot warning"
            >
              <span
                key={warningPulseId}
                className={`relative grid h-9 w-9 place-items-center rounded-full border border-red-300/50 bg-red-400/15 text-red-200 ${insightWarning.seen ? '' : 'groot-warning-bell'}`}
              >
                <Bell className="h-4 w-4" />
                {!insightWarning.seen && (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.9)]" />
                )}
              </span>
              <span className="hidden pr-1 sm:block">
                <span className="block text-xs font-black uppercase tracking-[0.2em]">Alert</span>
                <span className="block text-xs font-semibold text-slate-300">Groot detected a warning</span>
              </span>
            </button>
          )}
        </header>

        <DeviceAgentCommandBar
          devices={devices}
          selectedRoom={selectedRoom}
          onExecuteCommand={setDeviceStatus}
          onAddDevice={addDeviceFromAgent}
        />

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

            <div ref={insightRef} className="scroll-mt-6">
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
            </div>
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
        @keyframes groot-warning-bell {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          12% { transform: translateY(-3px) rotate(-12deg) scale(1.05); }
          24% { transform: translateY(1px) rotate(10deg) scale(1.02); }
          36% { transform: translateY(-2px) rotate(-8deg) scale(1.04); }
          48% { transform: translateY(0) rotate(6deg) scale(1); }
        }
        .groot-warning-bell {
          animation: groot-warning-bell 0.9s ease-in-out 0s 3;
        }
      `}</style>
    </div>
  );
};

export default SmartControl;
