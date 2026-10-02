import httpx
from typing import Dict, Any
from .schemas import QueryResponse

async def call_agent(url: str, payload: dict, timeout: int = 120) -> QueryResponse:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            return QueryResponse(**resp.json())
    except httpx.TimeoutException:
        return QueryResponse(
            request_id=payload.get("request_id", ""),
            node="unknown",
            status="error",
            answer="Timeout calling agent.",
            metadata={"error_code": "TIMEOUT"}
        )
    except Exception as e:
        return QueryResponse(
            request_id=payload.get("request_id", ""),
            node="unknown",
            status="error",
            answer=f"Error calling agent: {str(e)}",
            metadata={"error_code": "INTERNAL"}
        )
