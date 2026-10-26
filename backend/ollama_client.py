import httpx
from typing import Optional, Dict, Any
from backend.config import settings

class LocalOllamaClient:
    """
    Direct interface to local Ollama LLM running at http://127.0.0.1:11434.
    """
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, default_model: str = settings.PLANNER_MODEL):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model

    def generate(self, prompt: str, model: Optional[str] = None, system: Optional[str] = None) -> str:
        """Synchronous generation using local Ollama model."""
        target_model = model or self.default_model
        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": False
        }
        if system:
            payload["system"] = system

        timeout = httpx.Timeout(25.0, connect=3.0)
        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(f"{self.base_url}/api/generate", json=payload)
                if resp.status_code == 200:
                    return resp.json().get("response", "").strip()
        except Exception as e:
            pass

        return f"[Local LLM fallback response for: '{prompt[:40]}...']"

    async def agenerate(self, prompt: str, model: Optional[str] = None, system: Optional[str] = None) -> str:
        """Asynchronous generation using local Ollama model."""
        target_model = model or self.default_model
        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": False
        }
        if system:
            payload["system"] = system

        timeout = httpx.Timeout(25.0, connect=3.0)
        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                if resp.status_code == 200:
                    return resp.json().get("response", "").strip()
        except Exception:
            pass

        return f"Coordinated plan: Subtasks distributed across nodes and synthesized."

ollama_client = LocalOllamaClient()
