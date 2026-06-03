import random
import sqlite3
from uuid import uuid4
from pathlib import Path
from threading import Lock


BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "voltstream.db"

_init_lock = Lock()
_initialized = False

INITIAL_LIVE_POWER = {
    "grid_draw_kw": 2.5,
    "solar_generation_kw": 3.2,
}

INITIAL_HISTORY = {
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
    ],
}

INITIAL_DEVICES = [
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

INITIAL_BILLING = {
    "current_month_cost": 45.50,
    "projected_cost": 85.20,
    "budget_limit": 100.00,
}


def _connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def _row_to_dict(row):
    return dict(row) if row else None


def initialize_database():
    global _initialized
    if _initialized:
        return

    with _init_lock:
        if _initialized:
            return

        with _connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS live_power (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    grid_draw_kw REAL NOT NULL,
                    solar_generation_kw REAL NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS energy_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    period TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    usage_kwh REAL NOT NULL,
                    solar_kwh REAL NOT NULL,
                    sort_order INTEGER NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS devices (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    power_draw_w INTEGER NOT NULL,
                    room TEXT,
                    is_custom INTEGER NOT NULL DEFAULT 0,
                    default_power_w INTEGER
                )
                """
            )
            device_columns = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(devices)").fetchall()
            }
            if "room" not in device_columns:
                conn.execute("ALTER TABLE devices ADD COLUMN room TEXT")
            if "is_custom" not in device_columns:
                conn.execute("ALTER TABLE devices ADD COLUMN is_custom INTEGER NOT NULL DEFAULT 0")
            if "default_power_w" not in device_columns:
                conn.execute("ALTER TABLE devices ADD COLUMN default_power_w INTEGER")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS billing_summary (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    current_month_cost REAL NOT NULL,
                    projected_cost REAL NOT NULL,
                    budget_limit REAL NOT NULL
                )
                """
            )

            if conn.execute("SELECT COUNT(*) FROM live_power").fetchone()[0] == 0:
                conn.execute(
                    """
                    INSERT INTO live_power (id, grid_draw_kw, solar_generation_kw)
                    VALUES (1, ?, ?)
                    """,
                    (INITIAL_LIVE_POWER["grid_draw_kw"], INITIAL_LIVE_POWER["solar_generation_kw"]),
                )

            if conn.execute("SELECT COUNT(*) FROM energy_history").fetchone()[0] == 0:
                for period, points in INITIAL_HISTORY.items():
                    conn.executemany(
                        """
                        INSERT INTO energy_history
                            (period, timestamp, usage_kwh, solar_kwh, sort_order)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        [
                            (
                                period,
                                point["timestamp"],
                                point["usage_kwh"],
                                point["solar_kwh"],
                                index,
                            )
                            for index, point in enumerate(points)
                        ],
                    )

            if conn.execute("SELECT COUNT(*) FROM devices").fetchone()[0] == 0:
                conn.executemany(
                    """
                    INSERT INTO devices (id, name, type, status, power_draw_w)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    [
                        (
                            device["id"],
                            device["name"],
                            device["type"],
                            device["status"],
                            device["power_draw_w"],
                        )
                        for device in INITIAL_DEVICES
                    ],
                )

            if conn.execute("SELECT COUNT(*) FROM billing_summary").fetchone()[0] == 0:
                conn.execute(
                    """
                    INSERT INTO billing_summary
                        (id, current_month_cost, projected_cost, budget_limit)
                    VALUES (1, ?, ?, ?)
                    """,
                    (
                        INITIAL_BILLING["current_month_cost"],
                        INITIAL_BILLING["projected_cost"],
                        INITIAL_BILLING["budget_limit"],
                    ),
                )

        _initialized = True


def get_fluctuating_live_data():
    initialize_database()
    with _connect() as conn:
        live_power = conn.execute(
            "SELECT grid_draw_kw, solar_generation_kw FROM live_power WHERE id = 1"
        ).fetchone()

    grid_draw = max(0.0, round(live_power["grid_draw_kw"] + random.uniform(-0.2, 0.2), 2))
    solar_gen = max(0.0, round(live_power["solar_generation_kw"] + random.uniform(-0.3, 0.3), 2))
    net_usage = round(grid_draw - solar_gen, 2)

    return {
        "grid_draw_kw": grid_draw,
        "solar_generation_kw": solar_gen,
        "net_usage_kw": net_usage,
    }


def get_history(period):
    initialize_database()
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT timestamp, usage_kwh, solar_kwh
            FROM energy_history
            WHERE period = ?
            ORDER BY sort_order
            """,
            (period,),
        ).fetchall()

    return [_row_to_dict(row) for row in rows]


def get_devices():
    initialize_database()
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, name, type, status, power_draw_w, room, is_custom, default_power_w
            FROM devices
            ORDER BY
                CASE WHEN id LIKE 'dev_%' THEN 0 ELSE 1 END,
                CAST(substr(id, 5) AS INTEGER),
                name
            """
        ).fetchall()

    return [{**_row_to_dict(row), "is_custom": bool(row["is_custom"])} for row in rows]


def get_device(device_id):
    initialize_database()
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, name, type, status, power_draw_w, room, is_custom, default_power_w
            FROM devices
            WHERE id = ?
            """,
            (device_id,),
        ).fetchone()

    if not row:
        return None
    return {**_row_to_dict(row), "is_custom": bool(row["is_custom"])}


def update_device_power(device_id, status, power_draw_w):
    initialize_database()
    with _connect() as conn:
        conn.execute(
            "UPDATE devices SET status = ?, power_draw_w = ? WHERE id = ?",
            (status, power_draw_w, device_id),
        )

    return get_device(device_id)


def add_custom_device(name, device_type, room, status, power_draw_w):
    initialize_database()
    device_id = f"custom_{uuid4().hex[:12]}"
    default_power_w = max(0, int(power_draw_w))
    active_power_w = default_power_w if status == "ON" else 0

    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO devices
                (id, name, type, status, power_draw_w, room, is_custom, default_power_w)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """,
            (device_id, name, device_type, status, active_power_w, room, default_power_w),
        )

    return get_device(device_id)


def delete_device(device_id):
    initialize_database()
    with _connect() as conn:
        cursor = conn.execute(
            "DELETE FROM devices WHERE id = ?",
            (device_id,),
        )

    return cursor.rowcount > 0


def get_billing_summary():
    initialize_database()
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT current_month_cost, projected_cost, budget_limit
            FROM billing_summary
            WHERE id = 1
            """
        ).fetchone()

    return _row_to_dict(row)
