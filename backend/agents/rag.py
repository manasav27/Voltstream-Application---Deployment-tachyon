from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer

from prompts import RAG_ASSISTANT_PROMPT


BASE_DIR = Path(__file__).resolve().parent.parent
CHROMA_DIR = BASE_DIR / "chroma_db"
COLLECTION_NAME = "energy_docs"
MAX_DISTANCE = 1.25

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
client = chromadb.PersistentClient(path=str(CHROMA_DIR))
collection = client.get_collection(name=COLLECTION_NAME)


def build_rag_prompt(question: str, context: str, has_relevant_context: bool) -> str:
    return f"""
    {RAG_ASSISTANT_PROMPT}

    Has relevant PDF context:
    {has_relevant_context}

    PDF context:
    {context}

    Question:
    {question}
    """


def search_pdf_chunks(question: str, n_results: int = 5) -> dict:
    question_embedding = embedding_model.encode(question).tolist()
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=n_results,
        include=["documents", "distances", "metadatas"],
    )
    chunks = []
    documents = (results.get("documents") or [[]])[0]
    distances = (results.get("distances") or [[]])[0]
    metadatas = (results.get("metadatas") or [[]])[0]

    for index, document in enumerate(documents):
        distance = distances[index] if index < len(distances) else None
        if distance is None or distance > MAX_DISTANCE:
            continue
        metadata = metadatas[index] if index < len(metadatas) and metadatas[index] else {}
        chunks.append({
            "text": document,
            "distance": distance,
            "source": metadata.get("source", "uploaded energy PDF"),
        })

    return {
        "matched": bool(chunks),
        "sources": sorted({chunk["source"] for chunk in chunks}),
        "chunks": chunks,
    }
