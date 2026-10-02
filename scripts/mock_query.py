import argparse
import asyncio
import uuid
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.http_client import call_agent
from common.registry import get_registry

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", required=True, help="Name of the agent to query")
    parser.add_argument("--query", required=True, help="The query text")
    args = parser.parse_args()

    registry = get_registry()
    if args.agent not in registry:
        print(f"Error: Agent '{args.agent}' not found in registry.")
        print("Available agents:", list(registry.keys()))
        sys.exit(1)

    url = registry[args.agent]
    payload = {
        "request_id": str(uuid.uuid4()),
        "query": args.query,
        "context": {}
    }
    
    print(f"Sending query to {args.agent} at {url}...")
    response = await call_agent(url, payload)
    
    print("\n--- Response ---")
    print(f"Status: {response.status}")
    print(f"Node: {response.node}")
    print(f"Answer:\n{response.answer}")
    if response.metadata:
        print(f"Metadata: {response.metadata}")

if __name__ == "__main__":
    asyncio.run(main())
