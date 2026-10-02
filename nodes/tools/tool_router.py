from common.schemas import QueryRequest, QueryResponse

async def handle(request: QueryRequest) -> QueryResponse:
    query = request.query.lower()
    
    if "websearch" in query or "search" in query:
        # Simple websearch implementation using mock or simple logic
        ans = f"[Web Search Result] Found information for query: {request.query}"
    elif "calculate" in query or "+" in query or "-" in query:
        # Simple calculator mock
        ans = f"[Calculator] Evaluated expression in query: {request.query}"
    else:
        ans = "[Tools] No matching tool found."
        
    return QueryResponse(
        request_id=request.request_id,
        node="tools",
        status="success",
        answer=ans,
        metadata={}
    )
