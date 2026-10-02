import os
from .config_loader import load_config

def get_registry(base_dir: str = ".") -> dict:
    network_path = os.path.join(base_dir, "config", "network.yaml")
    network = load_config(network_path)
    laptops = network.get("laptops", {})
    
    registry = {}
    roles_dir = os.path.join(base_dir, "config", "roles")
    if os.path.exists(roles_dir):
        for role_file in os.listdir(roles_dir):
            if role_file.endswith(".yaml"):
                role_config = load_config(os.path.join(roles_dir, role_file))
                laptop = role_config.get("laptop")
                if laptop in laptops:
                    ip = laptops[laptop].get("ip")
                    port = laptops[laptop].get("port", network.get("network", {}).get("default_node_port", 8000))
                    for agent in role_config.get("agents", []):
                        if agent.get("expose"):
                            name = agent.get("name")
                            registry[name] = f"http://{ip}:{port}/{name}/process"
    return registry
