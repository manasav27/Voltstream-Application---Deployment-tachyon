from fastapi import APIRouter
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import chromadb
import google.generativeai as genai
from dotenv import load_dotenv
import os
from pathlib import Path
import re

BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = BASE_DIR / "chroma_db"
COLLECTION_NAME = "energy_docs"
MAX_DISTANCE = 1.25
GREETING_PATTERN = re.compile(
    r"^\s*(hi|hello|hey|hii|hai|yo|good\s+(morning|afternoon|evening)|namaste)\s*[!.?]*\s*$",
    re.IGNORECASE,
)

# Load .env variables
load_dotenv()

# Gemini API Key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Gemini model
gemini_model = genai.GenerativeModel("models/gemini-2.5-flash")

# FastAPI router
router = APIRouter()
# Embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
# Connect to ChromaDB
client = chromadb.PersistentClient(path=str(CHROMA_DIR))
collection = client.get_collection(name=COLLECTION_NAME)


# Request body model
class QuestionRequest(BaseModel):
    question: str

# Q&A Endpoint
@router.post("/api/v1/qa")
def ask_question(data: QuestionRequest):
    question = data.question.strip()

    if GREETING_PATTERN.match(question):
        return {
            "answer": "Hi, I'm Groot, your energy guides assistant. How can I help you?"
        }

    # Convert question to embedding
    question_embedding = embedding_model.encode(question).tolist()
    # Search top similar chunks
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=5,
        include=["documents", "distances"]
    )

    retrieved_chunks = results['documents'][0]
    distances = results['distances'][0]
    # If no relevant chunks found, keep the RAG bot restricted to the loaded PDFs.
    if not retrieved_chunks or not distances or distances[0] > MAX_DISTANCE:
        return {
            "answer": "I don't have that information"
        }
    # Combine chunks into context
    context = "\n".join(retrieved_chunks)

    # Prompt Gemini
    prompt = f"""
    You are Groot, a helpful RAG assistant for the loaded energy guide PDFs.
    Use semantic search results from the PDFs as your source material.
    Answer only when the PDF context contains information relevant to the question.
    Use your language ability to combine, summarize, and explain the PDF content
    naturally in your own words. You may make simple logical connections from
    the provided context, but do not add outside facts or answer from general
    world knowledge.
    If the question is outside the loaded PDF topics, such as celebrities,
    history, space, entertainment, or unrelated general knowledge, reply exactly:
    "I don't have that information"
    If the PDF context does not support the answer, reply exactly:
    "I don't have that information"

    PDF context:
    {context}

    Question:
    {question}
    """
    # Generate response
    response = gemini_model.generate_content(prompt)

    # Return answer
    return {
        "answer": response.text.strip()
    }
