import asyncio
from typing import Dict, Any, List
import httpx
from backend.config import settings

class ClusterRegistry:
    """
    Tracks and checks the health of all 4 PCs in the AgentVerse distributed cluster.
    """
    def __init__(self):
        self._set_nodes()

    def _set_nodes(self):
        if settings.EMULATION_MODE:
            self.nodes = {
                "laptop_a": {
                    "name": "Research Node (Laptop A)",
                    "role": "research",
                    "url": settings.EMULATION_NODE_A_URL,
                    "model": settings.RESEARCH_MODEL
                },
                "laptop_b": {
                    "name": "Document & RAG Node (Laptop B)",
                    "role": "document",
                    "url": settings.EMULATION_NODE_B_URL,
                    "model": settings.EMBEDDING_MODEL
                },
                "laptop_c": {
                    "name": "Analytics & Code Node (Laptop C)",
                    "role": "analytics_and_code",
                    "url": settings.EMULATION_NODE_C_URL,
                    "model": settings.CODE_MODEL
                },
                "laptop_d": {
                    "name": "Control Gateway (Laptop D)",
                    "role": "control_orchestrator",
                    "url": settings.EMULATION_NODE_D_URL,
                    "model": settings.PLANNER_MODEL
                }
            }
        else:
            self.nodes = {
                "laptop_a": {
                    "name": "Research Node (Laptop A)",
                    "role": "research",
                    "url": settings.NODE_A_URL,
                    "model": settings.RESEARCH_MODEL
                },
                "laptop_b": {
                    "name": "Document & RAG Node (Laptop B)",
                    "role": "document",
                    "url": settings.NODE_B_URL,
                    "model": settings.EMBEDDING_MODEL
                },
                "laptop_c": {
                    "name": "Analytics & Code Node (Laptop C)",
                    "role": "analytics_and_code",
                    "url": settings.NODE_C_URL,
                    "model": settings.CODE_MODEL
                },
                "laptop_d": {
                    "name": "Control Gateway (Laptop D)",
                    "role": "control_orchestrator",
                    "url": settings.NODE_D_URL,
                    "model": settings.PLANNER_MODEL
                }
            }

    async def ping_node(self, client: httpx.AsyncClient, node_key: str, node_info: Dict[str, Any]) -> Dict[str, Any]:
        """Pings a node's health endpoint to check connection and response latency."""
        # If this is Laptop D (Self control node running this process), it is always ONLINE
        if node_key == "laptop_d":
            return {
                "id": node_key,
                "name": node_info["name"],
                "role": node_info["role"],
                "url": node_info["url"],
                "model": node_info["model"],
                "status": "ONLINE",
                "details": {"self": True, "status": "healthy"}
            }

        # Check external port
        url = f"{node_info['url']}/health"
        try:
            resp = await client.get(url, timeout=1.2)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "id": node_key,
                    "name": node_info["name"],
                    "role": node_info["role"],
                    "url": node_info["url"],
                    "model": node_info["model"],
                    "status": "ONLINE",
                    "details": data
                }
        except Exception:
            pass

        # Check internal gateway mount fallback
        internal_mount_map = {
            "laptop_a": f"http://127.0.0.1:{settings.PORT}/node_a/health",
            "laptop_b": f"http://127.0.0.1:{settings.PORT}/node_b/health",
            "laptop_c": f"http://127.0.0.1:{settings.PORT}/node_c/health"
        }
        if node_key in internal_mount_map:
            try:
                resp = await client.get(internal_mount_map[node_key], timeout=1.0)
                if resp.status_code == 200:
                    return {
                        "id": node_key,
                        "name": node_info["name"],
                        "role": node_info["role"],
                        "url": node_info["url"],
                        "model": node_info["model"],
                        "status": "ONLINE",
                        "details": resp.json()
                    }
            except Exception:
                pass

        return {
            "id": node_key,
            "name": node_info["name"],
            "role": node_info["role"],
            "url": node_info["url"],
            "model": node_info["model"],
            "status": "OFFLINE",
            "details": None
        }

    async def get_cluster_status(self) -> Dict[str, Any]:
        """Queries all 4 laptops concurrently and returns real-time cluster health."""
        async with httpx.AsyncClient() as client:
            tasks = [self.ping_node(client, k, v) for k, v in self.nodes.items()]
            results = await asyncio.gather(*tasks)

        nodes_dict = {res["id"]: res for res in results}
        online_count = sum(1 for res in results if res["status"] == "ONLINE")

        return {
            "total_nodes": len(self.nodes),
            "online_nodes": online_count,
            "cluster_healthy": online_count > 0,
            "nodes": nodes_dict
        }

registry = ClusterRegistry()
