import json
import os
from collections import defaultdict, deque
from threading import Lock

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google import genai

from agents.chat import build_general_chat_prompt, build_page_insight_prompt
from models import ChatRequest, ChatResponse, PageInsightRequest, PageInsightResponse


load_dotenv()

client = genai.Client()
MODEL_NAME = os.getenv("GEMINI_MODEL")
if not MODEL_NAME:
    raise RuntimeError("GEMINI_MODEL is missing from backend/.env")

router = APIRouter(prefix="/api/v1")
CHAT_MEMORY_TURNS = 10
DEFAULT_CHAT_SESSION_ID = "default"
_chat_memory: dict[str, deque[dict[str, str]]] = defaultdict(lambda: deque(maxlen=CHAT_MEMORY_TURNS * 2))
_chat_memory_lock = Lock()


def _get_chat_history(session_id: str) -> list[dict[str, str]]:
    with _chat_memory_lock:
        return list(_chat_memory[session_id])


def _remember_chat_turn(session_id: str, question: str, answer: str) -> None:
    with _chat_memory_lock:
        _chat_memory[session_id].append({"role": "user", "content": question})
        _chat_memory[session_id].append({"role": "assistant", "content": answer})


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    try:
        question = request.question.strip()
        session_id = (request.session_id or DEFAULT_CHAT_SESSION_ID).strip() or DEFAULT_CHAT_SESSION_ID
        history = _get_chat_history(session_id)
        prompt = build_general_chat_prompt(question, history)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )
        answer = (response.text or "").strip()
        final_answer = answer or "I don't know that."
        _remember_chat_turn(session_id, question, final_answer)

        return {
            "answer": final_answer,
            "agent": "general_ai",
            "route": "general",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/page-insight", response_model=PageInsightResponse)
async def page_insight(request: PageInsightRequest):
    try:
        prompt = build_page_insight_prompt(
            request.page,
            request.question,
            json.dumps(request.data, indent=2),
        )
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )
        answer = (response.text or "").strip()
        return {"answer": answer or "I don't know that."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
