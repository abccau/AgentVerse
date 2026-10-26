from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from backend.config import settings
from backend.api import router as api_router

app = FastAPI(
    title="AgentVerse Cluster Gateway",
    version="0.4.0",
    description="Distributed Multi-Agent Architecture Gateway for 4-PC Physical Cluster"
)

# Enable CORS for all nodes & browsers on the local network
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint for Laptop D itself
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "node_id": settings.NODE_ID,
        "node_name": settings.NODE_NAME,
        "milestone": "40%",
        "host": settings.HOST,
        "port": settings.PORT
    }

# Include API router
app.include_router(api_router)

# Built-in LAN Proxy for Local Ollama
# Allows Laptop D and other laptops to access Ollama via port 8000 without Windows firewall permissions
import httpx
from fastapi import Request, Response

@app.api_route("/ollama/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def ollama_proxy(path: str, request: Request):
    target_url = f"http://127.0.0.1:11434/{path}"
    headers = dict(request.headers)
    headers.pop("host", None)
    body = await request.body()
    async with httpx.AsyncClient(timeout=45.0) as client:
        resp = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
            params=request.query_params
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type"))

# Import and mount node services directly into the gateway
from backend.nodes.node_a_research import app as node_a_app
from backend.nodes.node_b_document import app as node_b_app
from backend.nodes.node_c_analytics import app as node_c_app

app.mount("/node_a", node_a_app)
app.mount("/node_b", node_b_app)
app.mount("/node_c", node_c_app)

# Mount static files for frontend UI
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def serve_index():
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "AgentVerse 4-PC Gateway is running. Frontend not found."}
