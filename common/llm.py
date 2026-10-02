import httpx
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# Each worker reads its own Ollama URL from an env var (default: localhost:11434)
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")

async def generate(
    prompt: str,
    model: str,
    options: dict = None,
    json_mode: bool = False,
    url: str = None
) -> str:
    """
    Call Ollama /api/generate.
    URL priority: explicit arg > OLLAMA_URL env var > http://localhost:11434
    """
    ollama_url = url or OLLAMA_URL

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    if options:
        payload["options"] = options
    if json_mode:
        payload["format"] = "json"

    logger.info(f"[LLM] Calling Ollama at {ollama_url} | model={model} | prompt_len={len(prompt)}")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{ollama_url}/api/generate", json=payload, timeout=300)
            resp.raise_for_status()
            result = resp.json().get("response", "")
            logger.info(f"[LLM] Got response (len={len(result)})")
            return result
    except httpx.ConnectError as e:
        msg = f"Ollama not reachable at {ollama_url}. Is Ollama running? Error: {e}"
        logger.error(f"[LLM] {msg}")
        raise RuntimeError(msg) from e
    except httpx.HTTPStatusError as e:
        msg = f"Ollama HTTP error {e.response.status_code}: {e.response.text}"
        logger.error(f"[LLM] {msg}")
        raise RuntimeError(msg) from e
    except Exception as e:
        msg = f"Unexpected LLM error at {ollama_url}: {e}"
        logger.error(f"[LLM] {msg}")
        raise RuntimeError(msg) from e
