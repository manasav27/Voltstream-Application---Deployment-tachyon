import json
import os
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List
from uuid import uuid4

from prompts import ADVISOR_PROMPT, ANALYST_PROMPT, ORCHESTRATOR_PROMPT
from agents.multi_agent.annotations import get_pdf_knowledge, get_usage_data

try:
    from google.adk.agents import LlmAgent
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types
except ImportError:
    LlmAgent = None
    Runner = None
    InMemorySessionService = None
    types = None


BASE_DIR = Path(__file__).resolve().parents[2]
ORCHESTRATOR_TRACE_LOG = BASE_DIR / "orchestrator_traces.jsonl"
APP_NAME = "voltstream-multi-agent-orchestrator"
USER_ID = "voltstream-demo-user"
_trace_log_lock = Lock()


def build_orchestrator_agent(model_name: str, sub_agents: list) -> LlmAgent:
    return LlmAgent(
        name="orchestrator_agent",
        model=model_name,
        instruction=ORCHESTRATOR_PROMPT,
        sub_agents=sub_agents,
        output_key="orchestrator_result",
    )


def build_analyst_agent(model_name: str, tools: list) -> LlmAgent:
    return LlmAgent(
        name="analyst_agent",
        model=model_name,
        instruction=ANALYST_PROMPT,
        tools=tools,
        output_key="usage_analysis",
    )


def build_advisor_agent(model_name: str, tools: list) -> LlmAgent:
    return LlmAgent(
        name="advisor_agent",
        model=model_name,
        instruction=ADVISOR_PROMPT,
        tools=tools,
        output_key="energy_advice",
    )


def build_agent_trace(decision: Dict[str, str], extra_steps: List[Dict[str, Any]] | None = None) -> List[Dict[str, Any]]:
    trace = [
        {
            "agent": "orchestrator_agent",
            "step": "route",
            "selected_agent": decision["agent"],
            "route": decision["route"],
            "reason": decision["reason"],
        }
    ]
    if extra_steps:
        trace.extend(extra_steps)
    return trace


def log_orchestrator_trace(question: str, answer: str, agent: str, route: str, trace: List[Dict[str, Any]]) -> None:
    entry = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "question": question,
        "answer": answer,
        "agent": agent,
        "route": route,
        "trace": trace,
    }
    with _trace_log_lock:
        with ORCHESTRATOR_TRACE_LOG.open("a", encoding="utf-8") as log_file:
            log_file.write(json.dumps(entry, ensure_ascii=False) + "\n")


def traced_response(question: str, answer: str, agent: str, route: str, trace: list[dict]):
    log_orchestrator_trace(
        question=question,
        answer=answer,
        agent=agent,
        route=route,
        trace=trace,
    )
    return {
        "answer": answer,
        "agent": agent,
        "route": route,
        "trace": trace,
    }


def _extract_tool_payload(response: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(response.get("result"), dict):
        return response["result"]
    if isinstance(response.get("response"), dict):
        return response["response"]
    return response


async def run_adk_orchestrator(message: str, model_name: str) -> tuple[str, str, str, list[dict]]:
    if LlmAgent is None:
        return (
            "ADK is not available, so the multi-agent orchestrator cannot select Analyst or Advisor right now.",
            "orchestrator_agent",
            "adk_unavailable",
            [
                {
                    "agent": "orchestrator_agent",
                    "step": "adk_unavailable",
                    "action": "Google ADK is not installed, so no manual route fallback was used.",
                }
            ],
        )

    adk_model = os.getenv("ADK_MODEL") or model_name
    result, trace = await _run_adk_chat_agent(
        agent=build_orchestrator_agent(
            adk_model,
            [
                build_analyst_agent(adk_model, [get_usage_data]),
                build_advisor_agent(adk_model, [get_pdf_knowledge]),
            ],
        ),
        message=message,
    )
    if result.get("answer"):
        return result["answer"], result["agent"], result["route"], trace

    return (
        "I could not get a usable response from the ADK orchestrator.",
        "orchestrator_agent",
        "orchestrator_response",
        trace,
    )


async def _run_adk_chat_agent(
    *,
    agent: Any,
    message: str,
) -> tuple[Dict[str, Any], list[dict]]:
    session_service = InMemorySessionService()
    session_id = f"{agent.name}-{uuid4().hex}"
    await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=session_id,
    )
    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=session_service,
    )
    content = types.Content(role="user", parts=[types.Part(text=message)])
    final_text = ""
    tool_names: list[str] = []
    tool_results: list[Dict[str, Any]] = []
    trace: list[dict] = [
        {
            "agent": "orchestrator_agent",
            "step": "adk_start",
            "action": "ADK Orchestrator received the user request and selected specialist tools.",
        }
    ]

    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=session_id,
        new_message=content,
    ):
        for part in event.content.parts if event.content and event.content.parts else []:
            function_call = getattr(part, "function_call", None)
            function_response = getattr(part, "function_response", None)
            if function_call:
                tool_names.append(function_call.name)
                trace.append(
                    {
                        "agent": "orchestrator_agent",
                        "step": "select_tool",
                        "action": f"ADK Orchestrator selected {function_call.name}.",
                        "tool": function_call.name,
                    }
                )
            if function_response:
                response = _extract_tool_payload(dict(function_response.response))
                tool_results.append(response)
                trace.append(
                    {
                        "agent": "orchestrator_agent",
                        "step": "observe_tool",
                        "action": f"ADK Orchestrator received {function_response.name} output.",
                        "tool": function_response.name,
                        "pdf_sources": response.get("pdf_sources", response.get("sources", [])),
                    }
                )

        if event.is_final_response() and event.content and event.content.parts:
            final_text = "".join(part.text or "" for part in event.content.parts).strip()

    return _result_from_adk_tools(final_text, tool_names, tool_results), trace


def _result_from_adk_tools(
    final_text: str,
    tool_names: list[str],
    tool_results: list[Dict[str, Any]],
) -> Dict[str, str]:
    answer = final_text.strip()
    for result in reversed(tool_results):
        if result.get("answer"):
            answer = result["answer"].strip()
            break

    if "get_usage_data" in tool_names and "get_pdf_knowledge" in tool_names:
        return {"answer": answer, "agent": "advisor_agent", "route": "analyst_to_advisor"}
    if "get_pdf_knowledge" in tool_names:
        return {"answer": answer, "agent": "advisor_agent", "route": "advisor_only"}
    if "get_usage_data" in tool_names:
        return {"answer": answer, "agent": "analyst_agent", "route": "analyst_only"}

    return {
        "answer": answer or "I can help with Usage History, energy trends, solar, savings, and device routing.",
        "agent": "orchestrator_agent",
        "route": "orchestrator_response",
    }
