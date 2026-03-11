import yaml
import os

with open('packages/crew_engine/config/agents.yaml', 'r') as f:
    config = yaml.safe_load(f)

for key, value in config.items():
    role = value.get('role', 'N/A')
    print(f"'{role}' (len={len(role)})")
