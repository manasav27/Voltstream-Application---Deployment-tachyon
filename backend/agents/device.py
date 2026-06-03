import json
import os
import re
from pathlib import Path
from typing import Any, AsyncIterator, Dict, List

from dotenv import load_dotenv

from appliance_control import DEVICE_POWER_DEFAULTS
from db.database import get_device, get_devices, update_device_power
from prompts import DEVICE_AGENT_PROMPT

try:
    from google.adk.agents import Agent
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types
except ImportError:
    Agent = None
    Runner = None
    InMemorySessionService = None
    types = None


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

APP_NAME = "voltstream-device-control"
USER_ID = "voltstream-demo-user"
SESSION_ID = "voltstream-demo-session"


def tool_annotation(
    *,
    name: str,
    purpose: str,
    when_to_use: str,
    parameters: Dict[str, str],
    returns: str,
) -> Any:
    """Attach passive tool metadata without changing tool behavior."""
    def decorate(func: Any) -> Any:
        func.tool_annotation = {
            "name": name,
            "purpose": purpose,
            "when_to_use": when_to_use,
            "parameters": parameters,
            "returns": returns,
        }
        return func

    return decorate


def build_device_agent(agent_class: Any, model_name: str, tools: list) -> Any:
    return agent_class(
        name="voltstream_device_control_agent",
        model=model_name,
        description="Controls VoltStream smart home devices.",
        instruction=DEVICE_AGENT_PROMPT,
        tools=tools,
    )


def _device_payload(device: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": device["id"],
        "name": device["name"],
        "type": device["type"],
        "status": device["status"],
        "power_draw_w": device["power_draw_w"],
        "room": device.get("room"),
        "is_custom": device.get("is_custom", False),
        "default_power_w": device.get("default_power_w"),
    }


def _default_power_for(device: Dict[str, Any]) -> int:
    device_name = device["name"].lower()
    return int(
        device.get("default_power_w")
        or DEVICE_POWER_DEFAULTS.get(device_name)
        or max(device.get("power_draw_w", 0), 100)
    )


def _normalize_lookup(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9 ]+", " ", value.lower()).strip()
    return re.sub(r"\s+", " ", normalized)


def _find_device_by_name(device_name: str, room: str = "") -> Dict[str, Any] | None:
    requested_name = _normalize_lookup(device_name)
    requested_room = _normalize_lookup(room)
    if not requested_name:
        return None

    devices = get_devices()
    if requested_room:
        devices = [
            device for device in devices
            if _device_matches_room(device, requested_room)
        ]

    if requested_name in {"ac", "air conditioner", "air conditioning"}:
        requested_name = "living room ac"

    requested_words = set(requested_name.split())
    best_device = None
    best_score = 0

    for device in devices:
        device_name_normalized = _normalize_lookup(device["name"])
        device_room = _normalize_lookup(device.get("room") or "")
        searchable_words = set(device_name_normalized.split()) | set(device_room.split())

        if requested_name == device_name_normalized:
            score = 100
        elif requested_name in device_name_normalized or device_name_normalized in requested_name:
            score = 50
        else:
            score = len(requested_words & searchable_words) * 10

        if score > best_score:
            best_device = device
            best_score = score

    return best_device if best_score > 0 else None


def _device_matches_room(device: Dict[str, Any], normalized_room: str) -> bool:
    device_room = _normalize_lookup(device.get("room") or "")
    device_name = _normalize_lookup(device["name"])
    return device_room == normalized_room or normalized_room in device_name


@tool_annotation(
    name="get_device_status",
    purpose="Read the current status and power draw for one VoltStream smart device.",
    when_to_use="Use for status questions or before changing a named device.",
    parameters={
        "device_id": "Known device id such as dev_1. Optional when device_name is provided.",
        "device_name": "Natural device name such as AC, fan, refrigerator, lamp, TV, or heater.",
        "room": "Optional room hint when multiple devices may match.",
    },
    returns="ok flag plus the matched device payload, or an error if no device matches.",
)
def get_device_status(device_id: str = "", device_name: str = "", room: str = "") -> Dict[str, Any]:
    """Return the current VoltStream device status by device ID or device name."""
    device = get_device(device_id.strip()) if device_id else None
    if not device and device_name:
        device = _find_device_by_name(device_name, room)
    if not device:
        requested_device = device_id or device_name or "requested device"
        return {"ok": False, "error": f"Device {requested_device} was not found."}
    return {"ok": True, "device": _device_payload(device)}


@tool_annotation(
    name="toggle_device",
    purpose="Turn exactly one VoltStream smart device ON or OFF.",
    when_to_use="Use when the user asks to switch, turn, or power a specific device on or off.",
    parameters={
        "device_id": "Exact id of the device to update.",
        "state": "Desired state. Must be ON or OFF.",
    },
    returns="ok flag plus the updated device payload, or an error if the state/device is invalid.",
)
def toggle_device(device_id: str, state: str) -> Dict[str, Any]:
    """Turn a VoltStream device ON or OFF and return its updated status."""
    normalized_state = state.strip().upper()
    if normalized_state not in {"ON", "OFF"}:
        return {"ok": False, "error": "State must be ON or OFF."}

    device = get_device(device_id)
    if not device:
        return {"ok": False, "error": f"Device {device_id} was not found."}

    power_draw_w = 0 if normalized_state == "OFF" else _default_power_for(device)
    updated_device = update_device_power(device_id, normalized_state, power_draw_w)
    return {"ok": True, "device": _device_payload(updated_device)}


@tool_annotation(
    name="toggle_all_devices",
    purpose="Turn all VoltStream smart devices ON or OFF, optionally within one room.",
    when_to_use="Use for bulk commands like all devices off, every device on, or kitchen devices off.",
    parameters={
        "state": "Desired bulk state. Must be ON or OFF.",
        "room": "Optional room filter such as Living Room, Kitchen, Bedroom, or Bathroom.",
    },
    returns="ok flag, updated count, scope details, and updated device payloads.",
)
def toggle_all_devices(state: str, room: str = "") -> Dict[str, Any]:
    """Turn all VoltStream devices ON or OFF, optionally limited to one room."""
    normalized_state = state.strip().upper()
    if normalized_state not in {"ON", "OFF"}:
        return {"ok": False, "error": "State must be ON or OFF."}

    normalized_room = room.strip().lower()
    devices = get_devices()
    if normalized_room:
        requested_room = _normalize_lookup(normalized_room)
        devices = [
            device for device in devices
            if _device_matches_room(device, requested_room)
        ]

    updated_devices = []
    for device in devices:
        power_draw_w = 0 if normalized_state == "OFF" else _default_power_for(device)
        updated_device = update_device_power(device["id"], normalized_state, power_draw_w)
        updated_devices.append(_device_payload(updated_device))

    return {
        "ok": True,
        "count": len(updated_devices),
        "devices": updated_devices,
    }


def _build_agent() -> Any:
    if Agent is None:
        return None

    model_name = os.getenv("ADK_MODEL") or os.getenv("GEMINI_MODEL")
    if not model_name:
        raise RuntimeError("ADK_MODEL or GEMINI_MODEL is missing from backend/.env")

    return build_device_agent(
        Agent,
        model_name,
        [get_device_status, toggle_device, toggle_all_devices],
    )


async def run_adk_device_agent(message: str) -> Dict[str, Any]:
    if Agent is None:
        raise RuntimeError("Google ADK is not installed. Install google-adk to run the ADK path.")

    session_service = InMemorySessionService()
    await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=SESSION_ID,
    )
    runner = Runner(
        agent=_build_agent(),
        app_name=APP_NAME,
        session_service=session_service,
    )
    content = types.Content(role="user", parts=[types.Part(text=message)])

    final_text = ""
    trace: List[Dict[str, Any]] = [
        {"step": "plan", "detail": "Agent received the user goal and decided whether a tool is needed."}
    ]
    updated_device = None
    updated_devices = []

    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=content,
    ):
        for part in event.content.parts if event.content and event.content.parts else []:
            function_call = getattr(part, "function_call", None)
            function_response = getattr(part, "function_response", None)
            if function_call:
                trace.append(
                    {
                        "step": "select_tool",
                        "tool": function_call.name,
                        "args": dict(function_call.args),
                    }
                )
            if function_response:
                response = dict(function_response.response)
                trace.append(
                    {
                        "step": "observe",
                        "tool": function_response.name,
                        "response": response,
                    }
                )
                if response.get("device"):
                    updated_device = response["device"]
                if response.get("devices"):
                    updated_devices = response["devices"]

        if event.is_final_response() and event.content and event.content.parts:
            final_text = "".join(part.text or "" for part in event.content.parts).strip()

    trace.append(
        {
            "step": "respond",
            "detail": final_text or "Agent completed the requested device action.",
        }
    )
    return {
        "answer": final_text or "Done. The device status was updated.",
        "device": updated_device,
        "devices": updated_devices,
        "trace": trace,
        "mode": "google_adk",
    }


async def device_agent_events(message: str) -> AsyncIterator[str]:
    yield json.dumps({"event": "start", "message": message}) + "\n"
    try:
        result = await run_adk_device_agent(message)
        yield json.dumps({"event": "final", "data": result}) + "\n"
    except Exception as exc:
        yield json.dumps({"event": "error", "detail": str(exc)}) + "\n"
