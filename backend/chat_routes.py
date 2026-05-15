import os
import json
import re

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException

from appliance_control import handle_appliance_command
from models import ChatRequest, ChatResponse, PageInsightRequest, PageInsightResponse

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("models/gemini-2.5-flash")

router = APIRouter(prefix="/api/v1")

GREETING_PATTERN = re.compile(
    r"^\s*(hi|hello|hey|hii|hai|yo|good\s+(morning|afternoon|evening)|namaste)\s*[!.?]*\s*$",
    re.IGNORECASE,
)
IDENTITY_PATTERN = re.compile(
    r"\b(who\s+(are|r)\s+(you|u)|what\s+(are|r)\s+(you|u)|your\s+name|ur\s+name|what\s+do\s+(you|u)\s+do|wt\s+do\s+(you|u)\s+do)\b",
    re.IGNORECASE,
)
SELF_INTRO_PREFIX_PATTERN = re.compile(
    r"^\s*(i\s*(am|'m)\s+groot\.?\s*)+",
    re.IGNORECASE,
)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    try:
        question = request.question.strip()

        if GREETING_PATTERN.match(question) or IDENTITY_PATTERN.search(question):
            return {
                "answer": "Hi, I'm Groot, your AI assistant. How can I help you?"
            }

        appliance_response = handle_appliance_command(question)
        if appliance_response:
            return appliance_response

        prompt = f"""
        You are Groot, a friendly general-purpose AI assistant.
        You can answer questions about any topic, not only energy.
        Be helpful, accurate, and concise.
        Do not introduce yourself unless the user specifically asks your identity or greets you.
        Understand casual abbreviations like "u" for "you" and "frnd" for "friend".

        Answer the following question:
        Question:
        {question}
        """
        response = model.generate_content(prompt)
        answer = SELF_INTRO_PREFIX_PATTERN.sub("", response.text.strip()).strip()
        return {
            "answer": answer or response.text.strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/page-insight", response_model=PageInsightResponse)
async def page_insight(request: PageInsightRequest):
    try:
        prompt = f"""
        You are Groot, VoltStream's page-aware energy assistant.
        The user is asking about the current {request.page} page.

        Explain what is happening on this page using the provided page data.
        If there is any trouble, risk, high usage, budget warning, inefficient device,
        or useful action, mention it clearly and give practical suggestions.
        Keep the answer concise, friendly, and structured.

        User question:
        {request.question}

        Page data JSON:
        {json.dumps(request.data, indent=2)}
        """
        response = model.generate_content(prompt)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
