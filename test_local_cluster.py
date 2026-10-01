import subprocess
import sys
import time

def start_emulated_cluster():
    print("=" * 60)
    print("🚀 Starting AgentVerse 4-Node Emulated Cluster on 1 PC")
    print("=" * 60)
    
    # 1. Start Node A (Port 8001)
    p_a = subprocess.Popen([sys.executable, "-m", "uvicorn", "backend.nodes.node_a_research:app", "--port", "8001", "--host", "127.0.0.1"])
    print("✅ Node A (Research) started on http://127.0.0.1:8001")

    # 2. Start Node B (Port 8002)
    p_b = subprocess.Popen([sys.executable, "-m", "uvicorn", "backend.nodes.node_b_document:app", "--port", "8002", "--host", "127.0.0.1"])
    print("✅ Node B (Document & RAG) started on http://127.0.0.1:8002")

    # 3. Start Node C (Port 8003)
    p_c = subprocess.Popen([sys.executable, "-m", "uvicorn", "backend.nodes.node_c_analytics:app", "--port", "8003", "--host", "127.0.0.1"])
    print("✅ Node C (Analytics & Code) started on http://127.0.0.1:8003")

    time.sleep(2)
    print("\n🌟 Now launching Laptop D (Control Gateway) on http://localhost:8000 ...")
    print("👉 Open http://localhost:8000 in your browser to view all 4 nodes ONLINE!")
    print("=" * 60)

    try:
        # Start Gateway with EMULATION_MODE=True
        import os
        os.environ["EMULATION_MODE"] = "True"
        import uvicorn
        uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
    finally:
        print("\nStopping emulated cluster child processes...")
        p_a.terminate()
        p_b.terminate()
        p_c.terminate()

if __name__ == "__main__":
    start_emulated_cluster()
