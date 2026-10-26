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
            return resp.model_dump()
        except Exception as e:
            return {"status": "error", "answer": str(e), "metadata": {"error_code": "INTERNAL"}}
            
    agents_registry[name] = True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run an AgentVerse distributed node")
    parser.add_argument("--role", required=True, nargs="+", help="Role name, e.g. brain, worker_1, worker_2")
    args = parser.parse_args()
    
    # Normalize role argument to handle 'worker_1', 'worker 1', 'worker1', etc.
    raw_role = " ".join(args.role) if isinstance(args.role, list) else str(args.role)
    role = raw_role.strip().replace(" ", "_").lower()
    if role == "worker1":
        role = "worker_1"
    elif role == "worker2":
        role = "worker_2"
        
    network_config = load_config("config/network.yaml")
    laptops = network_config.get("laptops", {})
    
    # Fallback: if 'workers' role was requested but network has 'worker_1' or 'worker_2'
    if role == "workers" and "workers" not in laptops:
        if "worker_2" in laptops:
            role = "worker_2"
        elif "worker_1" in laptops:
            role = "worker_1"
            
    role_file = f"config/roles/{role}.yaml"
    if not os.path.exists(role_file):
        print(f"Error: Role configuration file '{role_file}' not found.")
        roles_dir = "config/roles"
        if os.path.exists(roles_dir):
            print("Available roles:", [f[:-5] for f in os.listdir(roles_dir) if f.endswith(".yaml")])
        exit(1)
        
    role_config = load_config(role_file)
    local_config = load_config("config/local.yaml")
    config = merge_configs(role_config, local_config)
    
    laptop_name = config.get("laptop")
    if laptop_name not in laptops:
        print(f"Error: Laptop '{laptop_name}' specified in {role_file} was not found in network.yaml")
        print("Available laptops in network.yaml:", list(laptops.keys()))
        exit(1)
        
    ip = laptops[laptop_name].get("ip", "0.0.0.0")
    port = laptops[laptop_name].get("port", network_config.get("network", {}).get("default_node_port", 8000))
    bind_host = config.get("bind_host", "0.0.0.0")
    
    for agent in config.get("agents", []):
        if agent.get("expose"):
            handler_path = agent.get("handler")
            mount_agent(agent["name"], handler_path)
            print(f"Mounted {agent['name']} at /{agent['name']}/process")
            
    print(f"Starting {role} node on {bind_host}:{port} (Announced IP: {ip})")
    uvicorn.run(app, host=bind_host, port=port)

