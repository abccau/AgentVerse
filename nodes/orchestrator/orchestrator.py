import logging
from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

logger = logging.getLogger(__name__)

async def handle(request: QueryRequest) -> QueryResponse:
    prompt = "Orchestrate and plan a solution for: " + request.query
    try:
        ans = await generate(prompt, "qwen3:8b")
        return QueryResponse(
            request_id=request.request_id,
            node="orchestrator",
            status="success",
            answer=f"Orchestrator processed:\n\n{ans}",
            metadata={"sources": []}
        )
    except RuntimeError as e:
        logger.error(f"[Orchestrator] LLM failed: {e}")
        return QueryResponse(
            request_id=request.request_id,
            node="orchestrator",
            status="error",
            answer=f"❌ Orchestrator error: {e}",
            metadata={"error_code": "LLM_UNAVAILABLE"}
        )
