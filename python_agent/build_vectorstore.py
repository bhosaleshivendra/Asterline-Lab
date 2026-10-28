import json
import os
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CORPUS_PATH = os.path.join(BASE_DIR, "corpus.jsonl")
PERSIST_DIR = os.path.join(BASE_DIR, "chroma_db")

def build_vectorstore():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    print("[Ingestion] Initialized local HuggingFace embedding model.")

    if not os.path.exists(CORPUS_PATH):
        raise FileNotFoundError(f"CRITICAL ERROR: Could not find '{CORPUS_PATH}'.")

    documents = []
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                record = json.loads(line.strip())
                text = record.get("text", "")
                metadata = {
                    "chunk_id": str(record.get("chunk_id", "")),
                    "doc_id": str(record.get("doc_id", "")),
                    "title": str(record.get("title", "")),
                    "category": str(record.get("category", "")),
                    "owner": str(record.get("owner", "")),
                    "source_url": str(record.get("source_url", "")),
                    "published": str(record.get("published", "")),
                    "version": str(record.get("version", ""))
                }
                documents.append(Document(page_content=text, metadata=metadata))

    print(f"[Ingestion] Loaded {len(documents)} document chunks from corpus.jsonl.")

    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=PERSIST_DIR
    )
    print(f"[Ingestion] Successfully persisted vector store at '{PERSIST_DIR}' with {vectorstore._collection.count()} items.")

if __name__ == "__main__":
    build_vectorstore()