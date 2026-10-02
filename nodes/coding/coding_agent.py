import logging
from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

logger = logging.getLogger(__name__)

async def handle(request: QueryRequest) -> QueryResponse:
    prompt = "Write code for this: " + request.query
    try:
        ans = await generate(prompt, "qwen2.5-coder:7b")
        return QueryResponse(
            request_id=request.request_id,
            node="coding",
            status="success",
            answer=f"Coding agent output:\n```python\n{ans}\n```",
            metadata={}
        )
    except RuntimeError as e:
        logger.error(f"[CodingAgent] LLM failed: {e}")
        return QueryResponse(
            request_id=request.request_id,
            node="coding",
            status="error",
            answer=f"❌ Coding agent error: {e}",
            metadata={"error_code": "LLM_UNAVAILABLE"}
        )
