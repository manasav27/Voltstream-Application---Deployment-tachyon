from fastapi import FastAPI, HTTPException, Query
from qa import router as qa_router
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from models import (
    LivePowerStatus,
    EnergyDataPoint,
    DeviceResponse,
    BillingSummary
)
from mock_data import (
    get_fluctuating_live_data,
    HISTORY_DATA,
    DEVICES,
    BILLING_SUMMARY as BILLING
)
from chat_routes import router as chat_router

app = FastAPI(title="VoltStream API")
app.include_router(qa_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chat_router)

@app.get("/api/v1/dashboard/live", response_model=LivePowerStatus)
def get_live_dashboard():
    return get_fluctuating_live_data()

@app.get("/api/v1/analytics/history", response_model=List[EnergyDataPoint])
def get_analytics_history(
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$")
):
    if period in HISTORY_DATA:
        return HISTORY_DATA[period]
    raise HTTPException(status_code=400, detail="Invalid period")

@app.get("/api/v1/devices", response_model=List[DeviceResponse])
def get_devices():
    return DEVICES

@app.patch("/api/v1/devices/{device_id}", response_model=DeviceResponse)
def update_device(device_id: str, status: str = Query(...)):
    for device in DEVICES:
        if device["id"] == device_id:
            device["status"] = status
            if status == "OFF":
                device["power_draw_w"] = 0
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
                    "Vehicle": 7200
                }
                device["power_draw_w"] = device_power_defaults.get(
                    name,
                    power_defaults.get(device["type"], 100)
                )
            return device
    raise HTTPException(status_code=404, detail="Device not found")

@app.get("/api/v1/billing/summary", response_model=BillingSummary)
def get_billing_summary():
    return BILLING
