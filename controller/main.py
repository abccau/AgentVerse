import os
import sys
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add parent dir to path so we can import common
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from common.http_client import call_agent
from common.registry import get_registry
from controller.router import get_target_agent

app = FastAPI()

# Mount frontend directory for static files
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

class ChatRequest(BaseModel):
    query: str
    mode: str = "Auto"

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    index_path = os.path.join(frontend_dir, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return f.read()

@app.get("/api/cluster/status")
async def get_cluster_status():
    registry = get_registry(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # Return mock connected nodes based on registry
    nodes = {}
    for agent, url in registry.items():
        base = "/".join(url.split("/")[:-2])
        if base not in nodes:
            nodes[base] = {"url": base, "agents": []}
        nodes[base]["agents"].append(agent)
    
    return {
        "status": "ok",
        "nodes": list(nodes.values()),
        "connected_count": len(nodes)
    }

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    registry = get_registry(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    target_agent = get_target_agent(req.query, req.mode)
    
    if target_agent not in registry:
        return {
            "status": "error",
            "node": "controller",
            "answer": f"Target agent '{target_agent}' is not running.",
            "execution_path": [{"agent": "controller", "status": "error"}]
        }
        
    url = registry[target_agent]
    payload = {
        "request_id": str(uuid.uuid4()),
        "query": req.query,
        "context": {}
    }
    
    # Simulate execution path for the UI animation
    execution_path = [
        {"agent": "Planner", "status": "completed"},
        {"agent": target_agent.capitalize(), "status": "completed"},
        {"agent": "Evaluator", "status": "completed"}
    ]
    
    response = await call_agent(url, payload)
    
    return {
        "status": response.status,
        "node": response.node,
        "answer": response.answer,
        "metadata": response.metadata,
        "execution_path": execution_path
    }
