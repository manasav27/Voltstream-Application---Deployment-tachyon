import os

from dotenv import load_dotenv
from fastapi import APIRouter
from google import genai

from agents.rag import build_rag_prompt, search_pdf_chunks
from models import QuestionRequest


load_dotenv()

genai_client = genai.Client()
MODEL_NAME = os.getenv("GEMINI_MODEL")
if not MODEL_NAME:
    raise RuntimeError("GEMINI_MODEL is missing from backend/.env")

router = APIRouter()


@router.post("/api/v1/qa")
def ask_question(data: QuestionRequest):
    question = data.question.strip()
    search_result = search_pdf_chunks(question)
    context = "\n".join(chunk["text"] for chunk in search_result["chunks"])
    prompt = build_rag_prompt(question, context, search_result["matched"])
    response = genai_client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )
    answer = (response.text or "").strip()
    return {
        "answer": answer or "I don't have that information"
    }
