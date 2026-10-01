from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI(title="AgentVerse - Node B (Document & RAG)")

class DocumentQuery(BaseModel):
    query: str

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "node": "Laptop B",
        "role": "Document Ingestion & Qdrant RAG",
        "model": "nomic-embed-text",
        "database": "Qdrant Connected"
    }

@app.post("/document/rag")
def execute_rag(req: DocumentQuery):
    return {
        "node": "Laptop B",
        "status": "COMPLETED",
        "query": req.query,
        "retrieved_chunks": [
            {"source": "report_q1.pdf", "score": 0.92, "content": f"Relevant context for '{req.query}'"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
