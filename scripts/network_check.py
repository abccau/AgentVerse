import asyncio
import httpx
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.registry import get_registry

async def check_node(url: str):
    # url is like http://ip:port/agent/process
    # we need http://ip:port/health
    base_url = "/".join(url.split("/")[:-2])
    health_url = f"{base_url}/health"
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(health_url)
            resp.raise_for_status()
            return True, resp.json()
    except Exception as e:
        return False, str(e)

async def main():
    registry = get_registry()
    print("Checking network health...")
    
    checked_base_urls = set()
    for agent, url in registry.items():
        base_url = "/".join(url.split("/")[:-2])
        if base_url in checked_base_urls:
            continue
        
        checked_base_urls.add(base_url)
        is_ok, result = await check_node(url)
        
        if is_ok:
            print(f"[OK] {base_url} - Agents: {result.get('agents', [])}")
        else:
            print(f"[FAIL] {base_url} - Error: {result}")

if __name__ == "__main__":
    asyncio.run(main())
