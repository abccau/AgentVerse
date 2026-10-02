from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

async def handle(request: QueryRequest) -> QueryResponse:
    # Basic mock orchestrator
    ans = await generate("Orchestrate this: " + request.query, "qwen3:8b")
    return QueryResponse(
        request_id=request.request_id,
        node="orchestrator",
        status="success",
        answer=f"Orchestrator processed. LLM says: {ans}",
        metadata={"sources": []}
    )
