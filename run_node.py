import argparse
import uvicorn
from fastapi import FastAPI, HTTPException
import os
import importlib
from common.config_loader import load_config, merge_configs

app = FastAPI()
agents_registry = {}

@app.get("/health")
async def health():
    return {"status": "ok", "agents": list(agents_registry.keys())}

def mount_agent(name, handler_path):
    module_path, func_name = handler_path.rsplit(":", 1)
    module = importlib.import_module(module_path)
    handler = getattr(module, func_name)
    
    @app.post(f"/{name}/process")
    async def process_endpoint(request: dict):
        try:
            from common.schemas import QueryRequest
            req = QueryRequest(**request)
            resp = await handler(req)
            return resp.dict()
        except Exception as e:
            return {"status": "error", "answer": str(e), "metadata": {"error_code": "INTERNAL"}}
            
    agents_registry[name] = True

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", required=True)
    args = parser.parse_args()
    
    # Load config
    role_config = load_config(f"config/roles/{args.role}.yaml")
    local_config = load_config("config/local.yaml")
    config = merge_configs(role_config, local_config)
    
    network_config = load_config("config/network.yaml")
    laptops = network_config.get("laptops", {})
    
    laptop_name = config.get("laptop")
    if laptop_name not in laptops:
        print(f"Error: Laptop {laptop_name} not found in network.yaml")
        exit(1)
        
    ip = laptops[laptop_name].get("ip", "0.0.0.0")
    port = laptops[laptop_name].get("port", network_config.get("network", {}).get("default_node_port", 8000))
    bind_host = config.get("bind_host", "0.0.0.0")
    
    for agent in config.get("agents", []):
        if agent.get("expose"):
            handler_path = agent.get("handler")
            # Convert python module format like nodes.orchestrator.orchestrator:handle
            mount_agent(agent["name"], handler_path)
            print(f"Mounted {agent['name']} at /{agent['name']}/process")
            
    print(f"Starting {args.role} node on {bind_host}:{port} (Announced IP: {ip})")
    uvicorn.run(app, host=bind_host, port=port)
