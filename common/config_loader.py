import yaml
import os

def load_config(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f) or {}

def merge_configs(base: dict, override: dict) -> dict:
    merged = base.copy()
    for k, v in override.items():
        if isinstance(v, dict) and k in merged and isinstance(merged[k], dict):
            merged[k] = merge_configs(merged[k], v)
        elif isinstance(v, list) and k in merged and isinstance(merged[k], list):
            # For lists like agents, we try to merge by 'name' key
            new_list = []
            base_dict = {item.get('name'): item for item in merged[k] if isinstance(item, dict) and 'name' in item}
            for override_item in v:
                if isinstance(override_item, dict) and 'name' in override_item:
                    name = override_item['name']
                    if name in base_dict:
                        new_item = merge_configs(base_dict[name], override_item)
                        base_dict[name] = new_item
                    else:
                        base_dict[name] = override_item
            
            # Reconstruct list
            for item in merged[k]:
                if isinstance(item, dict) and 'name' in item:
                    new_list.append(base_dict[item['name']])
                else:
                    new_list.append(item)
            
            # Add any new items from override that weren't in base
            for override_item in v:
                if isinstance(override_item, dict) and 'name' in override_item:
                    if not any(isinstance(i, dict) and i.get('name') == override_item['name'] for i in merged[k]):
                        new_list.append(override_item)
                else:
                    new_list.append(override_item)
            merged[k] = new_list
        else:
            merged[k] = v
    return merged
