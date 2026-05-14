import os
import json

base_dir = '/home/rithvik/EduSim_frontend/EduSim_frontend/public/assets'
catalog = {}

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.png', '.jpg', '.svg')):
            # Get relative path from assets/
            rel_path = os.path.relpath(os.path.join(root, file), base_dir)
            category = rel_path.split(os.sep)[0]
            
            if category not in catalog:
                catalog[category] = []
            
            asset_id = os.path.splitext(file)[0]
            catalog[category].append({
                "id": asset_id,
                "path": f"/assets/{rel_path}"
            })

# Save to the frontend workspace where we have access
with open('/home/rithvik/EduSim_frontend/EduSim_frontend/src/runtime/asset_catalog.json', 'w') as f:
    json.dump(catalog, f, indent=2)

print(f"Generated catalog with {sum(len(v) for v in catalog.values())} assets across {len(catalog)} categories.")
