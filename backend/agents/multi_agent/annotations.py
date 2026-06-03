from datetime import datetime, timedelta
from typing import Any, Dict, List

from agents.rag import search_pdf_chunks
from db.database import (
    get_devices,
    get_fluctuating_live_data,
    get_history,
)
from prompts import GENERAL_ENERGY_ADVICE_CONTEXT


def tool_annotation(
    *,
    name: str,
    agent: str | None = None,
    purpose: str,
    when_to_use: str,
    parameters: Dict[str, str],
    returns: str,
) -> Any:
    """Attach passive metadata to tools and agent methods."""
    def decorate(func: Any) -> Any:
        annotation = {
            "name": name,
            "purpose": purpose,
            "when_to_use": when_to_use,
            "parameters": parameters,
            "returns": returns,
        }
        if agent:
            annotation["agent"] = agent
        func.tool_annotation = annotation
        return func

    return decorate


def get_multi_agent_tool_annotations() -> List[Dict[str, Any]]:
    """Return annotations for multi-agent backend tools."""
    annotated_items = [
        get_usage_data,
        get_pdf_knowledge,
    ]
    return [
        item.tool_annotation
        for item in annotated_items
        if hasattr(item, "tool_annotation")
    ]


def _history_summary(points: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not points:
        return {
            "total_usage_kwh": 0,
            "total_solar_kwh": 0,
            "average_usage_kwh": 0,
            "peak_usage": None,
            "best_solar": None,
            "trend": "not enough data",
        }

    total_usage = round(sum(point["usage_kwh"] for point in points), 2)
    total_solar = round(sum(point["solar_kwh"] for point in points), 2)
    average_usage = round(total_usage / len(points), 2)
    first_usage = points[0]["usage_kwh"]
    last_usage = points[-1]["usage_kwh"]
    delta = round(last_usage - first_usage, 2)
    direction = "increased" if delta > 0 else "decreased" if delta < 0 else "stayed flat"

    return {
        "total_usage_kwh": total_usage,
        "total_solar_kwh": total_solar,
        "average_usage_kwh": average_usage,
        "peak_usage": max(points, key=lambda point: point["usage_kwh"]),
        "best_solar": max(points, key=lambda point: point["solar_kwh"]),
        "trend": direction,
        "trend_delta_kwh": delta,
    }


def _top_devices(devices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    active_devices = [device for device in devices if device["status"] == "ON"]
    ranked = sorted(active_devices, key=lambda device: device.get("power_draw_w", 0), reverse=True)
    return [
        {
            "name": device["name"],
            "type": device["type"],
            "status": device["status"],
            "power_draw_w": device["power_draw_w"],
        }
        for device in ranked[:5]
    ]


@tool_annotation(
    name="get_usage_data",
    agent="analyst_agent",
    purpose="Fetch VoltStream usage history, live grid/solar values, and active device power data from backend data sources.",
    when_to_use="Use whenever the Analyst Agent needs factual energy data before answering.",
    parameters={
        "question": "The user's energy-analysis question.",
    },
    returns="Structured daily, weekly, monthly, live, and active-device energy context.",
)
def get_usage_data(question: str) -> Dict[str, Any]:
    daily_history = get_history("daily")
    weekly_history = get_history("weekly")
    monthly_history = get_history("monthly")
    devices = get_devices()
    live = get_fluctuating_live_data()

    daily_summary = _history_summary(daily_history)
    weekly_summary = _history_summary(weekly_history)
    monthly_summary = _history_summary(monthly_history)
    yesterday_label = (datetime.now() - timedelta(days=1)).strftime("%a")
    yesterday_point = next(
        (point for point in weekly_history if point["timestamp"].lower() == yesterday_label.lower()),
        weekly_history[-2] if len(weekly_history) >= 2 else None,
    )

    return {
        "question": question,
        "live": live,
        "daily_history": daily_history,
        "weekly_history": weekly_history,
        "monthly_history": monthly_history,
        "daily_summary": daily_summary,
        "weekly_summary": weekly_summary,
        "monthly_summary": monthly_summary,
        "today_usage_kwh": daily_summary["total_usage_kwh"],
        "yesterday_usage_kwh": yesterday_point["usage_kwh"] if yesterday_point else None,
        "yesterday_label": yesterday_point["timestamp"] if yesterday_point else yesterday_label,
        "top_active_devices": _top_devices(devices),
    }


@tool_annotation(
    name="get_pdf_knowledge",
    agent="advisor_agent",
    purpose="Retrieve relevant uploaded energy PDF chunks for Advisor Agent recommendations.",
    when_to_use="Use whenever the Advisor Agent needs PDF-backed energy-saving guidance.",
    parameters={
        "question": "The user's advice or recommendation question.",
    },
    returns="Relevant PDF text chunks, source names, and general energy-saving context.",
)
def get_pdf_knowledge(question: str) -> Dict[str, Any]:
    search_result = search_pdf_chunks(question)
    return {
        "matched": search_result["matched"],
        "sources": search_result["sources"],
        "chunks": search_result["chunks"],
        "general_context": GENERAL_ENERGY_ADVICE_CONTEXT,
    }
