from common.schemas import QueryRequest, QueryResponse
from common.llm import generate

async def handle(request: QueryRequest) -> QueryResponse:
    prompt = (
        f"You are the specialized Research Agent on a distributed multi-agent system. "
        f"Conduct a thorough research investigation and provide factual insights for:\n\n"
        f"Query: {request.query}\n\n"
        f"Provide a clear, well-structured research briefing with key findings."
    )
    ans = await generate(prompt, model="qwen3.5:4b")
    return QueryResponse(
        request_id=request.request_id,
        node="research",
        status="success",
        answer=f"### Research Agent Briefing\n\n{ans}",
        metadata={"model": "qwen3.5:4b", "sources": ["Local Multi-Agent Intelligence Engine"]}
    )
