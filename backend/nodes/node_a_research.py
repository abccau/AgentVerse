from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(title="AgentVerse - Node A (Research)")

class ResearchQuery(BaseModel):
    query: str

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "node": "Laptop A",
        "role": "Research & Web Search",
        "model": "qwen2.5:7b",
        "tools": ["DuckDuckGo", "URLReader"]
    }

@app.post("/research/execute")
def execute_research(req: ResearchQuery):
    return {
        "node": "Laptop A",
        "status": "COMPLETED",
        "query": req.query,
        "findings": f"Gathered verified facts from web for: '{req.query}'",
        "citations": ["https://duckduckgo.com", "https://arxiv.org"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
