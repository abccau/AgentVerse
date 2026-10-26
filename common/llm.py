import httpx
from typing import Dict, Any, Optional

_cached_available_model: Optional[str] = None

async def get_available_ollama_model(client: httpx.AsyncClient, url: str) -> Optional[str]:
    """Auto-detects the first available model installed in local Ollama."""
    global _cached_available_model
    if _cached_available_model:
        return _cached_available_model
    try:
        resp = await client.get(f"{url}/api/tags", timeout=5.0)
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            if models:
                _cached_available_model = models[0].get("name")
                print(f"[Ollama] Auto-detected installed model: {_cached_available_model}")
                return _cached_available_model
    except Exception as e:
        pass
    return None

async def generate(prompt: str, model: str = "qwen3.5:4b", options: dict = None, json_mode: bool = False, url: str = "http://localhost:11434") -> str:
    """
    Sends a generation request to Ollama.
    If the requested model is not found, automatically falls back to any installed model.
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    if options:
        payload["options"] = options
    if json_mode:
        payload["format"] = "json"
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{url}/api/generate", json=payload, timeout=300)
            
            # If the requested model doesn't exist, try auto-detected installed model
            if resp.status_code == 404:
                installed_model = await get_available_ollama_model(client, url)
                if installed_model and installed_model != model:
                    payload["model"] = installed_model
                    resp = await client.post(f"{url}/api/generate", json=payload, timeout=300)
                    
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
    except Exception as e:
        # Fallback for testing without actual ollama running
        return f"[MOCK LLM] response for: {prompt[:30]}... (Error: {str(e)[:40]})"
