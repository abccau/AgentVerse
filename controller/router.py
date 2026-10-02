import re
from common.config_loader import load_config
from common.registry import get_registry

def get_target_agent(query: str, mode: str = "Auto") -> str:
    config = load_config("config/controller.yaml")
    routing = config.get("routing", {})
    
    # 1. Mode check
    if mode != "Auto":
        mode_map = routing.get("mode_map", {})
        if mode in mode_map:
            return mode_map[mode]
            
    # 2. Rules check
    rules = routing.get("rules", [])
    for rule in rules:
        if rule.get("when") == "regex":
            pattern = rule.get("pattern", "")
            if re.search(pattern, query, re.IGNORECASE):
                return rule.get("target")
                
    # 3. Default fallback
    return routing.get("default_target", "orchestrator")
