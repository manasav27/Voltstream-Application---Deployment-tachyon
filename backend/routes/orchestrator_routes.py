import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google import genai

from agents.multi_agent.orchestrator import (
    build_agent_trace,
    run_adk_orchestrator,
    traced_response,
)
from models import ChatRequest, ChatResponse


load_dotenv()

client = genai.Client()
MODEL_NAME = os.getenv("GEMINI_MODEL")
if not MODEL_NAME:
    raise RuntimeError("GEMINI_MODEL is missing from backend/.env")

router = APIRouter(prefix="/api/v1")


@router.post("/orchestrator", response_model=ChatResponse)
async def run_orchestrator(request: ChatRequest):
    try:
        question = request.question.strip()
        answer, agent, route, adk_trace = await run_adk_orchestrator(question, MODEL_NAME)
        decision = {
            "agent": agent,
            "route": route,
            "reason": "ADK Orchestrator selected the specialist tool path.",
        }
        trace = build_agent_trace(decision, adk_trace)
        return traced_response(question, answer, agent, route, trace)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
