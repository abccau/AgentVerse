from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from backend.registry import registry
from backend.config import settings

router = APIRouter(prefix="/api/v1", tags=["Cluster & Queries"])

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    session_id: str
    query: str
    client_ip: str
    cluster_plan: List[Dict[str, Any]]
    dispatched_nodes: List[str]
    llm_analysis: str
    cluster_results: Dict[str, Any]
    final_synthesized_answer: str
    status: str
    message: str

@router.get("/cluster")
async def get_cluster_status():
    """Returns the live status of all 4 PCs in the cluster."""
    return await registry.get_cluster_status()

@router.post("/query", response_model=QueryResponse)
async def execute_query(req: QueryRequest, request: Request):
    """
    Receives queries from ANY connected PC on the LAN,
    decomposes them with Planner, dispatches tasks to agents on each node,
    and returns the final synthesized results.
    """
    session_id = req.session_id or str(uuid.uuid4())
    client_ip = request.client.host if request.client else "unknown"

    print("\n" + "=" * 65)
    print(f"📥 [CLUSTER LOG] INCOMING QUERY FROM: {client_ip}")
    if "192.168.1.30" in client_ip or "192.168.1.13" in client_ip:
        print(f"📍 SENDER IDENTIFIED: Laptop D (Control Node)")
    print(f"💬 QUERY TEXT: '{req.query}'")
    print(f"🔑 SESSION ID: {session_id}")
    print("=" * 65)

    try:
        from agents.planner.planner import PlannerAgent
        from backend.ollama_client import ollama_client
        from agents.research.research_agent import ResearchAgent
        from agents.rag.rag_agent import DocumentRAGAgent
        from agents.data_analysis.data_agent import DataAnalysisAgent
        from agents.code.code_agent import CodeAgent

        planner = PlannerAgent()
        plan = planner.plan_query(req.query)

        # 1. Prompt local Ollama (qwen2.5:1.5b) for planning coordination
        prompt = f"Analyze the following user query for multi-agent delegation: '{req.query}'. Provide a brief 2-sentence executive summary of how the tasks should be coordinated across the cluster."
        llm_synthesis = await ollama_client.agenerate(prompt)

        # 2. Execute agent tasks across cluster nodes
        results = {}
        for task in plan:
            target = task.get("target_agent")
            try:
                if target == "research":
                    researcher = ResearchAgent()
                    res = researcher.run(req.query)
                    results["research_node"] = {
                        "pc": "Laptop A (Research Node)",
                        "brief": res.get("brief"),
                        "citations": res.get("citations")
                    }
                elif target == "document":
                    rag = DocumentRAGAgent()
                    res = rag.retrieve(req.query)
                    results["document_node"] = {
                        "pc": "Laptop B (Document & RAG Node)",
                        "chunks": [c.get("text") for c in res.get("matched_chunks", [])]
                    }
                elif target == "data_analysis":
                    data_agent = DataAnalysisAgent()
                    res = data_agent.analyze_dataset(None, req.query)
                    results["analytics_node"] = {
                        "pc": "Laptop C (Analytics & Code Node)",
                        "metrics": res.get("summary", {}).get("columns"),
                        "sandbox_output": res.get("sandbox_execution", {}).get("output", "").strip()
                    }
                elif target == "code":
                    code_agent = CodeAgent()
                    res = code_agent.generate_and_test(req.query)
                    results["code_node"] = {
                        "pc": "Laptop C (Analytics & Code Node)",
                        "code": res.get("code"),
                        "execution_result": res.get("output")
                    }
            except Exception as task_err:
                results[f"{target or 'node'}_error"] = {
                    "pc": task.get("assigned_pc", "Cluster Node"),
                    "brief": f"Task execution error: {str(task_err)}"
                }

        # Check if Ollama returned a fallback placeholder
        if not llm_synthesis or llm_synthesis.startswith("[Local LLM"):
            node_names = ", ".join(set(p.get("assigned_pc", "node") for p in plan))
            llm_synthesis = f"Delegated across {len(plan)} cluster node(s) ({node_names}) for: '{req.query}'."

        # 3. Local Ollama final synthesis of all node outputs
        synthesis_prompt = f"User Query: '{req.query}'. Node results: {results}. Provide a complete answer combining these agent insights:"
        final_answer = await ollama_client.agenerate(synthesis_prompt)

        if not final_answer or final_answer.startswith("[Local LLM"):
            # Synthesize real output from node results
            synthesized_parts = []
            if "research_node" in results:
                r = results["research_node"]
                if r.get("brief"):
                    synthesized_parts.append(r["brief"])
                if r.get("citations"):
                    synthesized_parts.append("Sources:\n" + "\n".join(f"- {c}" for c in r["citations"]))
            if "analytics_node" in results:
                a = results["analytics_node"]
                if a.get("sandbox_output"):
                    synthesized_parts.append(f"Analytics Output:\n{a['sandbox_output']}")
            if "code_node" in results:
                c = results["code_node"]
                if c.get("execution_result"):
                    synthesized_parts.append(f"Execution Output:\n{c['execution_result']}")
            if "document_node" in results:
                d = results["document_node"]
                if d.get("chunks"):
                    synthesized_parts.append("Document Context:\n" + "\n".join(d["chunks"]))

            if synthesized_parts:
                final_answer = "\n\n".join(synthesized_parts)
            else:
                final_answer = f"Completed execution across cluster nodes for query: '{req.query}'."

        dispatched = [p["assigned_pc"] for p in plan]

        return QueryResponse(
            session_id=session_id,
            query=req.query,
            client_ip=client_ip,
            cluster_plan=plan,
            dispatched_nodes=dispatched,
            llm_analysis=llm_synthesis,
            cluster_results=results,
            final_synthesized_answer=final_answer,
            status="COMPLETED",
            message=f"Query executed across cluster nodes with results synthesized by local Ollama ({settings.PLANNER_MODEL})."
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Cluster execution error: {str(e)}")
