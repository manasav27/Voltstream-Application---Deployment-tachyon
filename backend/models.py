from pydantic import BaseModel
from typing import Optional

class LivePowerStatus(BaseModel):
    grid_draw_kw: float
    solar_generation_kw: float
    net_usage_kw: float

class EnergyDataPoint(BaseModel):
    timestamp: str
    usage_kwh: float
    solar_kwh: float

class DeviceResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    power_draw_w: int

class BillingSummary(BaseModel):
    current_month_cost: float
    projected_cost: float
    budget_limit: float

# NEW CHAT REQUEST MODEL
class ChatRequest(BaseModel):
    question: str

# NEW CHAT RESPONSE MODEL
class ChatResponse(BaseModel):
    answer: str
    device: Optional[DeviceResponse] = None

class PageInsightRequest(BaseModel):
    page: str
    question: str
    data: dict

class PageInsightResponse(BaseModel):
    answer: str
