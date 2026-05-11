import random

# Initial static mock data
LIVE_POWER_DATA = {
    "grid_draw_kw": 2.5,
    "solar_generation_kw": 3.2,
    "net_usage_kw": -0.7  # Negative means sending back to grid
}

HISTORY_DATA = {
    "daily": [
        {"timestamp": "00:00", "usage_kwh": 0.5, "solar_kwh": 0.0},
        {"timestamp": "04:00", "usage_kwh": 0.4, "solar_kwh": 0.0},
        {"timestamp": "08:00", "usage_kwh": 1.2, "solar_kwh": 1.5},
        {"timestamp": "12:00", "usage_kwh": 1.8, "solar_kwh": 4.2},
        {"timestamp": "16:00", "usage_kwh": 2.0, "solar_kwh": 2.8},
        {"timestamp": "20:00", "usage_kwh": 2.5, "solar_kwh": 0.0},
    ],
    "weekly": [
        {"timestamp": "Mon", "usage_kwh": 12.5, "solar_kwh": 15.0},
        {"timestamp": "Tue", "usage_kwh": 14.2, "solar_kwh": 16.5},
        {"timestamp": "Wed", "usage_kwh": 13.0, "solar_kwh": 10.2},
        {"timestamp": "Thu", "usage_kwh": 15.5, "solar_kwh": 18.0},
        {"timestamp": "Fri", "usage_kwh": 16.0, "solar_kwh": 14.5},
        {"timestamp": "Sat", "usage_kwh": 18.2, "solar_kwh": 17.2},
        {"timestamp": "Sun", "usage_kwh": 17.5, "solar_kwh": 16.8},
    ],
    "monthly": [
        {"timestamp": "Week 1", "usage_kwh": 105.0, "solar_kwh": 110.5},
        {"timestamp": "Week 2", "usage_kwh": 112.5, "solar_kwh": 95.0},
        {"timestamp": "Week 3", "usage_kwh": 98.2, "solar_kwh": 105.2},
        {"timestamp": "Week 4", "usage_kwh": 108.5, "solar_kwh": 115.0},
    ]
}

DEVICES = [
    {"id": "dev_1", "name": "Living Room AC", "type": "HVAC", "status": "ON", "power_draw_w": 1500},
    {"id": "dev_2", "name": "Refrigerator", "type": "Appliance", "status": "ON", "power_draw_w": 400},
    {"id": "dev_3", "name": "Washing Machine", "type": "Appliance", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_4", "name": "Water Heater", "type": "Appliance", "status": "ON", "power_draw_w": 2000},
    {"id": "dev_5", "name": "EV Charger", "type": "Vehicle", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_6", "name": "Pool Pump", "type": "Outdoor", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_7", "name": "Bedroom AC", "type": "HVAC", "status": "ON", "power_draw_w": 1200},
    {"id": "dev_8", "name": "Bedside Lamp", "type": "Appliance", "status": "OFF", "power_draw_w": 50},
    {"id": "dev_9", "name": "Living Room TV", "type": "Appliance", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_10", "name": "Living Room Lamp", "type": "Appliance", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_11", "name": "Kitchen Dishwasher", "type": "Appliance", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_12", "name": "Kitchen Oven", "type": "Appliance", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_13", "name": "Kitchen Coffee Maker", "type": "Appliance", "status": "ON", "power_draw_w": 900},
    {"id": "dev_14", "name": "Bedroom Heater", "type": "Appliance", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_15", "name": "Bedroom Fan", "type": "HVAC", "status": "ON", "power_draw_w": 75},
    {"id": "dev_16", "name": "Bathroom Exhaust Fan", "type": "HVAC", "status": "OFF", "power_draw_w": 0},
    {"id": "dev_17", "name": "Bathroom Mirror Light", "type": "Appliance", "status": "ON", "power_draw_w": 80},
]

BILLING_SUMMARY = {
    "current_month_cost": 45.50,
    "projected_cost": 85.20,
    "budget_limit": 100.00
}

def get_fluctuating_live_data():
    """Helper to simulate slightly changing real-time data."""
    grid_draw = max(0.0, round(LIVE_POWER_DATA["grid_draw_kw"] + random.uniform(-0.2, 0.2), 2))
    solar_gen = max(0.0, round(LIVE_POWER_DATA["solar_generation_kw"] + random.uniform(-0.3, 0.3), 2))
    net_usage = round(grid_draw - solar_gen, 2)
    
    return {
        "grid_draw_kw": grid_draw,
        "solar_generation_kw": solar_gen,
        "net_usage_kw": net_usage
    }
