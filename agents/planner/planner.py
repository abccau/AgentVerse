from typing import List, Dict, Any, Optional
import httpx
from backend.config import settings

class PlannerAgent:
    """
    Control Node Planner (Laptop D)
    Decomposes user queries into an ordered DAG of subtasks assigned to physical cluster PCs
    powered by your local Ollama LLM (qwen2.5:1.5b).
    """
    def __init__(self, model_name: str = settings.PLANNER_MODEL):
        self.model_name = model_name
        from backend.ollama_client import ollama_client
        self.llm = ollama_client

    def plan_query(self, user_query: str) -> List[Dict[str, Any]]:
        """Decomposes user query into tasks mapped to cluster nodes."""
        plan = []
        q_lower = user_query.lower()

        node_urls = {
            "laptop_a": settings.NODE_A_URL if not settings.EMULATION_MODE else settings.EMULATION_NODE_A_URL,
            "laptop_b": settings.NODE_B_URL if not settings.EMULATION_MODE else settings.EMULATION_NODE_B_URL,
            "laptop_c": settings.NODE_C_URL if not settings.EMULATION_MODE else settings.EMULATION_NODE_C_URL,
            "laptop_d": settings.NODE_D_URL if not settings.EMULATION_MODE else settings.EMULATION_NODE_D_URL
        }

        # Research / Search Task -> Laptop A
        if any(w in q_lower for w in ["search", "research", "competitor", "market", "latest", "trends", "find"]):
            plan.append({
                "task_id": "subtask_research_1",
                "agent": "research",
                "target_agent": "research",
                "target_node": "laptop_a",
                "assigned_pc": "Laptop A (Research Node)",
                "node_url": node_urls["laptop_a"],
                "instruction": f"Perform comprehensive web search and fact verification on: {user_query}",
                "dependencies": []
            })

        # Document / RAG Task -> Laptop B
        if any(w in q_lower for w in ["document", "pdf", "report", "rag", "retrieval", "file", "uploaded"]):
            plan.append({
                "task_id": "subtask_document_2",
                "agent": "document",
                "target_agent": "document",
                "target_node": "laptop_b",
                "assigned_pc": "Laptop B (Document & RAG Node)",
                "node_url": node_urls["laptop_b"],
                "instruction": f"Extract and retrieve relevant grounded semantic chunks for: {user_query}",
                "dependencies": []
            })

        # Data Analysis Task -> Laptop C
        if any(w in q_lower for w in ["data", "sales", "csv", "calculate", "statistics", "analyze", "dataset"]):
            plan.append({
                "task_id": "subtask_data_3",
                "agent": "data_analysis",
                "target_agent": "data_analysis",
                "target_node": "laptop_c",
                "assigned_pc": "Laptop C (Analytics & Code Node)",
                "node_url": node_urls["laptop_c"],
                "instruction": f"Process statistical aggregations and dataset metrics for: {user_query}",
                "dependencies": []
            })

        # Code Generation Task -> Laptop C
        if any(w in q_lower for w in ["code", "script", "python", "forecast", "program", "function"]):
            deps = ["subtask_data_3"] if any(t["task_id"] == "subtask_data_3" for t in plan) else []
            plan.append({
                "task_id": "subtask_code_4",
                "agent": "code",
                "target_agent": "code",
                "target_node": "laptop_c",
                "assigned_pc": "Laptop C (Analytics & Code Node)",
                "node_url": node_urls["laptop_c"],
                "instruction": f"Generate and execute tested Python script for: {user_query}",
                "dependencies": deps
            })

        # If general question, default to Research + Response
        if not plan:
            plan.append({
                "task_id": "subtask_research_1",
                "agent": "research",
                "target_agent": "research",
                "target_node": "laptop_a",
                "assigned_pc": "Laptop A (Research Node)",
                "node_url": node_urls["laptop_a"],
                "instruction": f"Gather knowledge context for: {user_query}",
                "dependencies": []
            })

        return plan
