from common.schemas import QueryRequest, QueryResponse, Plan, PlanStep

async def handle(request: QueryRequest) -> QueryResponse:
    # Returns a mock plan
    return QueryResponse(
        request_id=request.request_id,
        node="planner",
        status="success",
        answer='{"complexity": "simple", "steps": [{"id": "s1", "agent": "research", "task": "do research"}]}',
        metadata={}
    )
