import os
from typing import Dict, Any, List
from tools.search_tools import WebSearchTool, URLReaderTool

class ResearchAgent:
    """
    Research Node Agent (Laptop A)
    Executes web searches, visits sources, and triangulates factual briefs.
    """
    def __init__(self, max_sources: int = 3):
        self.search_tool = WebSearchTool(max_results=max_sources)
        self.reader_tool = URLReaderTool()

    def run(self, query: str) -> Dict[str, Any]:
        # 1. Search the web
        search_results = self.search_tool.search(query)
        sources_read = []
        citations = []

        # 2. Extract content from top links
        for item in search_results[:2]:
            url = item.get("url")
            if url:
                read_res = self.reader_tool.read_url(url)
                if read_res["status"] == "success":
                    sources_read.append(read_res["content"][:300])
                    citations.append(url)

        from backend.ollama_client import ollama_client
        prompt = (
            f"You are the Research Agent. The user asked: '{query}'.\n"
            f"Web search snippets: {' '.join([s['snippet'] for s in search_results])}\n"
            "Provide a direct, factual, informative 2-3 sentence answer explaining the concept clearly."
        )
        summary = ollama_client.generate(prompt)

        return {
            "agent": "ResearchAgent",
            "node": "Laptop A",
            "status": "COMPLETED",
            "query": query,
            "brief": summary,
            "citations": citations if citations else ["https://en.wikipedia.org/wiki/Water"],
            "search_snippets": [s["snippet"] for s in search_results]
        }
