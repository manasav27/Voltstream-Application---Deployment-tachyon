import re
from threading import Timer

from database import get_devices, update_device_power


DEVICE_POWER_DEFAULTS = {
    "living room ac": 1500,
    "refrigerator": 400,
    "washing machine": 500,
    "water heater": 2000,
    "ev charger": 7200,
    "pool pump": 1200,
    "bedroom ac": 1200,
    "bedside lamp": 50,
    "living room tv": 180,
    "living room lamp": 75,
    "kitchen dishwasher": 1200,
    "kitchen oven": 2200,
    "kitchen coffee maker": 900,
    "bedroom heater": 1500,
    "bedroom fan": 75,
    "bathroom exhaust fan": 60,
    "bathroom mirror light": 80,
}

ROOM_WORDS = {"living", "room", "bedroom", "kitchen", "bathroom", "pool"}
DEVICE_WORDS = {
    "ac",
    "air",
    "computer",
    "refrigerator",
    "washing",
    "machine",
    "heater",
    "charger",
    "pump",
    "lamp",
    "lamps",
    "light",
    "lights",
    "tv",
    "dishwasher",
    "oven",
    "coffee",
    "maker",
    "fan",
    "laptop",
    "monitor",
    "purifier",
    "speaker",
    "speakers",
}

DEVICE_ALIASES = {
    "bedroom lamp": "Bedside Lamp",
    "bedroom lamps": "Bedside Lamp",
    "bedroom light": "Bedside Lamp",
    "bedroom lights": "Bedside Lamp",
}


def _normalize(text):
    normalized = re.sub(r"[^a-z0-9 ]+", " ", text.lower()).strip()
    return re.sub(r"\brm\b", "room", normalized)


def _delay_seconds(text):
    match = re.search(r"\bin\s+(\d+)\s*(second|seconds|minute|minutes|hour|hours)\b", text)
    if not match:
        return 0, ""

    amount = int(match.group(1))
    unit = match.group(2)
    multiplier = 1
    if unit.startswith("minute"):
        multiplier = 60
    elif unit.startswith("hour"):
        multiplier = 3600

    return amount * multiplier, f" in {amount} {unit}"


def _find_device(command):
    normalized_command = _normalize(command)
    command_words = set(normalized_command.split())

    for alias, device_name in DEVICE_ALIASES.items():
        if alias in normalized_command:
            return next((device for device in get_devices() if device["name"] == device_name), None)

    best_device = None
    best_score = 0

    for device in get_devices():
        device_name = _normalize(device["name"])
        device_room = _normalize(device.get("room") or "")
        device_words = set(device_name.split())
        room_words = set(device_room.split())
        searchable_words = device_words | room_words
        generic_device_words = device_words - ROOM_WORDS
        matched_device_words = command_words & device_words & DEVICE_WORDS
        matched_generic_words = command_words & generic_device_words
        matched_room_words = command_words & searchable_words & ROOM_WORDS
        score = (len(matched_device_words) * 3) + (len(matched_generic_words) * 2) + len(matched_room_words)

        if "lamp" in device_words and "lamps" in command_words:
            score += 3
        if "light" in device_words and "lights" in command_words:
            score += 3

        if score > best_score and (matched_device_words or matched_generic_words):
            best_device = device
            best_score = score

    return best_device if best_score > 0 else None


def _apply_device_action(device, action, brightness=None):
    device_name = device["name"].lower()
    default_power = device.get("default_power_w") or DEVICE_POWER_DEFAULTS.get(
        device_name,
        max(device["power_draw_w"], 100),
    )

    if action == "off":
        return update_device_power(device["id"], "OFF", 0)

    if brightness is not None:
        power_draw_w = round(default_power * brightness / 100)
    else:
        power_draw_w = default_power

    return update_device_power(device["id"], "ON", power_draw_w)


def _device_payload(device):
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


def _apply_later(device, action, brightness):
    _apply_device_action(device, action, brightness)


def handle_appliance_command(question):
    normalized_question = _normalize(question)
    action = None
    brightness = None

    if re.search(r"\b(turn|switch)\s+off\b|\boff\b", normalized_question):
        action = "off"
    elif re.search(r"\b(turn|switch)\s+on\b|\bon\b", normalized_question):
        action = "on"
    elif re.search(r"\bdim\b|\bset\b", normalized_question):
        action = "on"

    brightness_match = re.search(r"\b(\d{1,3})\s*%|\bto\s+(\d{1,3})\b", normalized_question)
    if brightness_match:
        brightness = max(0, min(100, int(brightness_match.group(1) or brightness_match.group(2))))
        action = action or "on"

    if not action:
        return None

    device = _find_device(question)
    if not device:
        return {
            "answer": "I don't have access to that device. Add it on the Smart Devices page first, then I can control it."
        }

    delay, delay_label = _delay_seconds(normalized_question)
    if delay:
        timer = Timer(delay, _apply_later, args=(device, action, brightness))
        timer.daemon = True
        timer.start()
        action_text = "turn off" if action == "off" else "turn on"
        if brightness is not None:
            action_text = f"set to {brightness}%"
        return {
            "answer": f"Scheduled: I will {action_text} {device['name']}{delay_label}."
        }

    updated_device = _apply_device_action(device, action, brightness)
    if brightness is not None:
        return {
            "answer": f"Done. {updated_device['name']} is ON at {brightness}%.",
            "device": _device_payload(updated_device),
        }

    return {
        "answer": f"Done. {updated_device['name']} is now {updated_device['status']}.",
        "device": _device_payload(updated_device),
    }
