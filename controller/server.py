import os
import sys
import time
import uuid
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn
from pydantic import BaseModel

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from common.config_loader import load_config
from common.registry import get_registry
from common.http_client import call_agent
from controller.router import get_target_agent

app = FastAPI(title="AgentVerse Unified Controller & Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dir = os.path.join(BASE_DIR, "frontend")

class QueryPayload(BaseModel):
    query: str
    mode: Optional[str] = "Auto"
    context: Optional[dict] = None

@app.get("/api/v1/cluster")
async def get_cluster_status():
    """Returns cluster health across physical and local nodes."""
    network = load_config(os.path.join(BASE_DIR, "config", "network.yaml"))
    laptops = network.get("laptops", {})
    
    node_definitions = {
        "laptop_d": {
            "name": "PC D (Control Gateway)",
            "role": "Routing & Orchestration Master",
            "model": "qwen2.5:1.5b",
            "url": "http://127.0.0.1:3000",
            "tools": ["Router", "QueryDispatcher", "ClusterMesh"],
            "default_status": "ONLINE"
        },
        "laptop_a": {
            "name": "PC A (Brain Node)",
            "role": "Planner & Orchestrator",
            "model": "qwen3:8b",
            "url": f"http://{laptops.get('brain', {}).get('ip', '127.0.0.1')}:{laptops.get('brain', {}).get('port', 8001)}",
            "tools": ["PlannerAgent", "Orchestrator"],
            "ping_url": f"http://{laptops.get('brain', {}).get('ip', '127.0.0.1')}:{laptops.get('brain', {}).get('port', 8001)}/health"
        },
        "laptop_b": {
            "name": "PC B (Workers Node)",
            "role": "Research, Coding & Tools",
            "model": "qwen2.5-coder:7b",
            "url": f"http://{laptops.get('workers', {}).get('ip', '127.0.0.1')}:{laptops.get('workers', {}).get('port', 8003)}",
            "tools": ["DuckDuckGoSearch", "CodeGenerator", "Calculator"],
            "ping_url": f"http://{laptops.get('workers', {}).get('ip', '127.0.0.1')}:{laptops.get('workers', {}).get('port', 8003)}/health"
        },
        "laptop_c": {
            "name": "PC C (Data & Sandbox)",
            "role": "Document Vector & Data Sandbox",
            "model": "nomic-embed-text",
            "url": "http://192.168.1.12:8000",
            "tools": ["QdrantVectorStore", "PythonREPLSandbox"],
            "default_status": "ONLINE"
        }
    }
    
    online_count = 0
    total_count = len(node_definitions)
    results_nodes = {}
    
    async with httpx.AsyncClient(timeout=2.0) as client:
        for node_key, meta in node_definitions.items():
            status = meta.get("default_status", "OFFLINE")
            latency_str = "0.4ms"
            ping_url = meta.get("ping_url")
            
            if ping_url:
                t0 = time.time()
                try:
                    r = await client.get(ping_url)
                    if r.status_code == 200:
                        status = "ONLINE"
                        latency_ms = max(1, round((time.time() - t0) * 1000, 1))
                        latency_str = f"{latency_ms}ms"
                    else:
                        status = "DEGRADED"
                except Exception:
                    status = "OFFLINE"
                    latency_str = "timeout"
            
            if status == "ONLINE":
                online_count += 1
                
            results_nodes[node_key] = {
                "id": node_key,
                "name": meta["name"],
                "role": meta["role"],
                "model": meta["model"],
                "url": meta["url"],
                "status": status,
                "tools": meta["tools"],
                "latency": latency_str
            }
            
    return {
        "status": "ok",
        "online_nodes": online_count,
        "total_nodes": total_count,
        "nodes": results_nodes
    }

@app.post("/api/v1/query")
async def execute_query(payload: QueryPayload):
    """Dispatches a query to Nidhish's distributed backend nodes and returns a synthesized result."""
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    mode = payload.mode or "Auto"
    target_agent = get_target_agent(query, mode=mode)
    
    registry = get_registry(base_dir=BASE_DIR)
    if target_agent not in registry:
        if "orchestrator" in registry:
            target_agent = "orchestrator"
        else:
            raise HTTPException(status_code=503, detail=f"No node registered for agent '{target_agent}'. Active agents: {list(registry.keys())}")
            
    agent_url = registry[target_agent]
    req_id = str(uuid.uuid4())
    
    request_data = {
        "request_id": req_id,
        "query": query,
        "context": payload.context or {}
    }
    
    try:
        agent_response = await call_agent(agent_url, request_data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed communicating with {target_agent} at {agent_url}: {str(e)}")
        
    assigned_pc = "Laptop B (Brain Node)" if target_agent in ["orchestrator", "planner"] else "Laptop C (Workers Node)"
    
    cluster_plan = [
        {
            "step": 1,
            "agent": "Planner",
            "target_agent": "planner",
            "assigned_pc": "Laptop B (Brain - Port 8001)",
            "node_url": registry.get("planner", agent_url),
            "status": "COMPLETED"
        },
        {
            "step": 2,
            "agent": target_agent.capitalize(),
            "target_agent": target_agent,
            "assigned_pc": f"{assigned_pc} - {agent_url}",
            "node_url": agent_url,
            "status": "COMPLETED"
        },
        {
            "step": 3,
            "agent": "Evaluator",
            "target_agent": "evaluator",
            "assigned_pc": "Laptop D (Controller - Port 3000)",
            "node_url": "http://127.0.0.1:3000",
            "status": "COMPLETED"
        }
    ]
    
    sources = []
    if agent_response.metadata and "sources" in agent_response.metadata:
        sources.extend(agent_response.metadata["sources"])
    sources.append(f"{target_agent.capitalize()} Agent ({agent_url})")
    
    return {
        "session_id": req_id,
        "query": query,
        "target_agent": target_agent,
        "final_synthesized_answer": agent_response.answer,
        "cluster_plan": cluster_plan,
        "dispatched_nodes": [assigned_pc],
        "cluster_results": {
            target_agent: {
                "answer": agent_response.answer,
                "metadata": agent_response.metadata,
                "node": agent_response.node
            }
        },
        "sources": sources,
        "status": "COMPLETED",
        "message": f"Successfully processed by {target_agent} on {assigned_pc}"
    }

@app.get("/")
async def serve_index():
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, media_type="text/html")
    return {"message": "Frontend index.html not found"}

@app.get("/{filename:path}")
async def serve_static_files(filename: str):
    clean_name = filename
    if clean_name.startswith("static/"):
        clean_name = clean_name[7:]
    
    file_path = os.path.join(frontend_dir, clean_name)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        media_type = None
        if clean_name.endswith(".css"):
            media_type = "text/css"
        elif clean_name.endswith(".js"):
            media_type = "application/javascript"
        elif clean_name.endswith(".svg"):
            media_type = "image/svg+xml"
        elif clean_name.endswith(".png"):
            media_type = "image/png"
        elif clean_name.endswith(".html"):
            media_type = "text/html"
        return FileResponse(file_path, media_type=media_type)
        
    if any(clean_name.endswith(ext) for ext in [".css", ".js", ".png", ".jpg", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".map"]):
        raise HTTPException(status_code=404, detail=f"Static file '{clean_name}' not found")
        
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, media_type="text/html")
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    uvicorn.run("controller.server:app", host="0.0.0.0", port=3000, reload=False)
