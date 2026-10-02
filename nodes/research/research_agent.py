from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

async def handle(request: QueryRequest) -> QueryResponse:
    ans = await generate("Research this: " + request.query, "qwen3:8b")
    return QueryResponse(
        request_id=request.request_id,
        node="research",
        status="success",
        answer=f"Research agent output: {ans}",
        metadata={}
    )
