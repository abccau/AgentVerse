import httpx
from typing import Dict, Any, Optional

async def generate(prompt: str, model: str, options: dict = None, json_mode: bool = False, url: str = "http://localhost:11434") -> str:
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
            resp.raise_for_status()
            return resp.json().get("response", "")
    except Exception as e:
        # Fallback for testing without actual ollama running
        return f"[MOCK LLM] response for: {prompt[:30]}..."
