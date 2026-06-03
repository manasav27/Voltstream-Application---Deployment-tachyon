from typing import List

from fastapi import APIRouter, HTTPException, Query

from db.database import (
    add_custom_device,
    delete_device as delete_db_device,
    get_billing_summary as get_db_billing_summary,
    get_devices as get_db_devices,
    get_fluctuating_live_data,
    get_history,
    update_device_power,
)
from models import (
    BillingSummary,
    DeviceCreateRequest,
    DeviceResponse,
    EnergyDataPoint,
    LivePowerStatus,
)


router = APIRouter()


@router.get("/api/v1/dashboard/live", response_model=LivePowerStatus)
def get_live_dashboard():
    return get_fluctuating_live_data()


@router.get("/api/v1/analytics/history", response_model=List[EnergyDataPoint])
def get_analytics_history(
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$")
):
    history = get_history(period)
    if history:
        return history
    raise HTTPException(status_code=400, detail="Invalid period")


@router.get("/api/v1/devices", response_model=List[DeviceResponse])
def get_devices():
    return get_db_devices()


@router.patch("/api/v1/devices/{device_id}", response_model=DeviceResponse)
def update_device(device_id: str, status: str = Query(...)):
    device = next((item for item in get_db_devices() if item["id"] == device_id), None)
    if device:
        if status == "OFF":
            power_draw_w = 0
        elif device.get("default_power_w"):
            power_draw_w = device["default_power_w"]
        else:
            name = device["name"].lower()
            device_power_defaults = {
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
            power_defaults = {
                "HVAC": 1500,
                "Appliance": 400,
                "Outdoor": 1200,
                "Vehicle": 7200,
            }
            power_draw_w = device_power_defaults.get(
                name,
                power_defaults.get(device["type"], 100),
            )
        return update_device_power(device_id, status, power_draw_w)
    raise HTTPException(status_code=404, detail="Device not found")


@router.post("/api/v1/devices", response_model=DeviceResponse)
def create_device(device: DeviceCreateRequest):
    name = device.name.strip()
    room = device.room.strip()
    device_type = device.type.strip() or "Appliance"
    status = device.status.upper()

    if not name:
        raise HTTPException(status_code=400, detail="Device name is required")
    if status not in {"ON", "OFF"}:
        raise HTTPException(status_code=400, detail="Status must be ON or OFF")
    if device.power_draw_w < 0:
        raise HTTPException(status_code=400, detail="Power draw cannot be negative")

    return add_custom_device(name, device_type, room, status, device.power_draw_w)


@router.delete("/api/v1/devices/{device_id}")
def delete_device(device_id: str):
    if delete_db_device(device_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="Device not found")


@router.get("/api/v1/billing/summary", response_model=BillingSummary)
def get_billing_summary():
    return get_db_billing_summary()
