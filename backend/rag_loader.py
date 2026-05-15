from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = BASE_DIR / "chroma_db"
PDF_FOLDER = BASE_DIR / "energy_pdfs"
COLLECTION_NAME = "energy_docs"

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Create persistent ChromaDB database
client = chromadb.PersistentClient(path=str(CHROMA_DIR))

# Function to split text into chunks
def chunk_text(text, chunk_size=120, overlap=30):
    words = text.split()
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks


# Function to load PDFs into ChromaDB
def load_pdfs():
    try:
        client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass

    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    for pdf_path in sorted(PDF_FOLDER.glob("*.pdf")):
        print(f"Loading {pdf_path.name}...")
        reader = PdfReader(str(pdf_path))
        full_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        chunks = chunk_text(full_text)
        print(f"Created {len(chunks)} chunks")

        for index, chunk in enumerate(chunks):
            embedding = model.encode(chunk).tolist()
            collection.add(
                documents=[chunk],
                embeddings=[embedding],
                metadatas=[{"source": pdf_path.name, "chunk": index}],
                ids=[f"{pdf_path.stem}-{index}"]
            )

    print("All PDFs loaded into ChromaDB successfully!")


if __name__ == "__main__":
    load_pdfs()
