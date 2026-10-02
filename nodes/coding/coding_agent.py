from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

async def handle(request: QueryRequest) -> QueryResponse:
    prompt = (
        f"You are the specialized Coding Agent on a distributed multi-agent system. "
        f"Implement clean, well-documented, working code for:\n\n"
        f"{request.query}\n\n"
        f"Provide only the code with necessary comments and an explanation."
    )
    ans = await generate(prompt, model="qwen3.5:4b")
    return QueryResponse(
        request_id=request.request_id,
        node="coding",
        status="success",
        answer=ans,
        metadata={"model": "qwen3.5:4b"}
    )
