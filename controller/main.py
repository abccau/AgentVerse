"""
AgentVerse Controller Entry Point
Delegates to controller.server which hosts the unified gateway and modern workflow UI.
"""
import uvicorn
from controller.server import app

if __name__ == "__main__":
    uvicorn.run("controller.main:app", host="0.0.0.0", port=8501, reload=False)

