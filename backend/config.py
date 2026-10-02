import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Gateway / Node definition
    NODE_ID: str = "laptop_a"
    NODE_NAME: str = "Research & Web Intelligence Node (Laptop A)"
    
    # 4-PC Cluster Registry Endpoints (Default LAN IPs, customizable via env)
    NODE_A_URL: str = "http://192.168.1.10:8000"  # Laptop A - Research Node
    NODE_B_URL: str = "http://192.168.1.11:8000"  # Laptop B - Document Node
    NODE_C_URL: str = "http://192.168.1.12:8000"  # Laptop C - Analytics & Code Node
    NODE_D_URL: str = "http://192.168.1.13:8000"  # Laptop D - Control Node (Self)

    # Local emulation flag for testing 4 nodes on 1 machine if needed
    EMULATION_MODE: bool = False
    EMULATION_NODE_A_URL: str = "http://127.0.0.1:8001"
    EMULATION_NODE_B_URL: str = "http://127.0.0.1:8002"
    EMULATION_NODE_C_URL: str = "http://127.0.0.1:8003"
    EMULATION_NODE_D_URL: str = "http://127.0.0.1:8000"

    # LLM Settings (Connected to your local Ollama on port 11434)
    OLLAMA_BASE_URL: str = "http://192.168.1.15:8000/ollama"
    PLANNER_MODEL: str = "qwen2.5:1.5b"
    RESEARCH_MODEL: str = "qwen2.5:1.5b"
    CODE_MODEL: str = "qwen2.5:1.5b"
    EMBEDDING_MODEL: str = "nomic-embed-text:latest"

    # Vector DB Settings
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "agentverse_docs"

    ALLOWED_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
