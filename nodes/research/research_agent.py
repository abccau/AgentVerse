import logging
from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

logger = logging.getLogger(__name__)

async def handle(request: QueryRequest) -> QueryResponse:
    prompt = "Research this topic thoroughly: " + request.query
    try:
        ans = await generate(prompt, "qwen3:8b")
        return QueryResponse(
            request_id=request.request_id,
            node="research",
            status="success",
            answer=f"Research agent output:\n\n{ans}",
            metadata={}
        )
    except RuntimeError as e:
        logger.error(f"[ResearchAgent] LLM failed: {e}")
        return QueryResponse(
            request_id=request.request_id,
            node="research",
            status="error",
            answer=f"❌ Research agent error: {e}",
            metadata={"error_code": "LLM_UNAVAILABLE"}
        )
