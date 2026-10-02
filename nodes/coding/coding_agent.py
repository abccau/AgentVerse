from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

async def handle(request: QueryRequest) -> QueryResponse:
    ans = await generate("Write code for this: " + request.query, "qwen2.5-coder:7b")
    return QueryResponse(
        request_id=request.request_id,
        node="coding",
        status="success",
        answer=f"Coding agent output:\n```python\n{ans}\n```",
        metadata={}
    )
