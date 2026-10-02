import uuid
import random
import asyncio
from common.schemas import QueryRequest, QueryResponse
from common.llm import generate
from common.registry import get_registry
from common.http_client import call_agent

async def handle(request: QueryRequest) -> QueryResponse:
    query = request.query
    
    # 1. Analyze the query to determine intent
    prompt = (
        f"Analyze this query and reply with EXACTLY ONE WORD from this list: "
        f"[CODING, RESEARCH, BOTH, GENERAL].\nQuery: '{query}'\nClassification:"
    )
    classification = (await generate(prompt, "qwen3:8b")).strip().upper()
    
    registry = get_registry()
    tasks = []
    agent_names = []
    
    # Helper to create a sub-task
    def create_task(agent_name):
        if agent_name in registry and registry[agent_name]:
            url = random.choice(registry[agent_name])
            payload = {
                "request_id": str(uuid.uuid4()),
                "query": query,
                "context": {}
            }
            tasks.append(call_agent(url, payload))
            agent_names.append(agent_name)
            return True
        return False

    # 2. Distribute tasks based on classification
    if "CODING" in classification or "BOTH" in classification:
        create_task("coding")
    if "RESEARCH" in classification or "BOTH" in classification:
        create_task("research")
        
    # 3. Execute concurrently and synthesize
    if tasks:
        results = await asyncio.gather(*tasks)
        
        # If only one worker was needed, return its exact response directly to the UI!
        if len(results) == 1:
            return results[0]
            
        # If BOTH were needed, combine their answers
        context_str = ""
        for name, res in zip(agent_names, results):
            context_str += f"\n--- {name.upper()} AGENT ({res.node}) RESPONSE ---\n{res.answer}\n"
            
        synth_prompt = (
            f"You are the master orchestrator. Synthesize the following agent responses to answer the user's query.\n"
            f"User Query: {query}\n\nAgent Responses:\n{context_str}\n\nFinal Answer:"
        )
        final_answer = await generate(synth_prompt, "qwen3:8b")
        return QueryResponse(
            request_id=request.request_id,
            node="orchestrator (Synthesized)",
            status="success",
            answer=final_answer,
            metadata={"classification": classification, "agents_used": agent_names}
        )
    else:
        # Fallback to general answer if no agents matched or were available
        final_answer = await generate(f"Please answer this query: {query}", "qwen3:8b")
        return QueryResponse(
            request_id=request.request_id,
            node="orchestrator",
            status="success",
            answer=final_answer,
            metadata={"classification": classification, "agents_used": []}
        )
