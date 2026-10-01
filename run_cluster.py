import uvicorn
from backend.main import app
from backend.config import settings

if __name__ == "__main__":
    print(f"🚀 Starting AgentVerse 4-PC Cluster Gateway on http://{settings.HOST}:{settings.PORT}")
    print(f"📡 Node D (Control): {settings.NODE_D_URL}")
    print(f"📡 Node A (Research): {settings.NODE_A_URL}")
    print(f"📡 Node B (Document & RAG): {settings.NODE_B_URL}")
    print(f"📡 Node C (Analytics & Code): {settings.NODE_C_URL}")
    print("🌐 Any PC on the same Wi-Fi/LAN can open http://<your-ip>:8000 to view the cluster and query it.")
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
