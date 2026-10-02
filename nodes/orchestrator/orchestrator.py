from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

async def handle(request: QueryRequest) -> QueryResponse:
    prompt = (
        f"You are the central Orchestrator for a distributed multi-agent system. "
        f"Analyze and orchestrate a response for:\n\n"
        f"Query: {request.query}"
    )
    ans = await generate(prompt, model="qwen3.5:4b")
    return QueryResponse(
        request_id=request.request_id,
        node="orchestrator",
        status="success",
        answer=ans,
        metadata={"model": "qwen3.5:4b", "sources": []}
    )
