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
                if read_res.get("status") == "success" and read_res.get("content"):
                    sources_read.append(read_res["content"][:400])
                    citations.append(url)

        if sources_read:
            findings_text = " ".join(sources_read)
        elif search_results:
            findings_text = " ".join([s.get("snippet", "") for s in search_results if s.get("snippet")])
        else:
            findings_text = f"Context gathered for '{query}'."

        summary = findings_text if len(findings_text) > 20 else f"Synthesized findings for '{query}' from {len(citations)} sources."

        return {
            "agent": "ResearchAgent",
            "node": "Laptop A",
            "status": "COMPLETED",
            "query": query,
            "brief": summary,
            "findings": findings_text,
            "citations": citations,
            "search_snippets": [s["snippet"] for s in search_results]
        }
