# AgentVerse — Distributed Multi-Agent AI Platform

AgentVerse is an enterprise-grade distributed multi-agent intelligence platform designed to operate across multiple physical laptops/workstations over a Local Area Network (LAN), fully capable of running offline in air-gapped environments using local LLMs (via Ollama).

---

## 1. System Architecture & Concept

AgentVerse delegates complex queries across specialized physical machines rather than relying on a monolithic agent:

```
[ User Browser / UI Client ]
           |
           v
+--------------------------------------------------------+
|  Laptop 1: Controller Gateway (Port 8000 / 8501)       |
|  - React Mission Control Dashboard & REST API          |
|  - Query Router & Evaluator / Final Synthesizer        |
+--------------------------------------------------------+
           | HTTP POST (/orchestrator/process)
           v
+--------------------------------------------------------+
|  Laptop 2: Brain Node (Port 8001)                      |
|  - Orchestrator (Intent classification & delegation)   |
|  - Planner (Multi-agent execution graph & DAG)         |
+--------------------------------------------------------+
           | HTTP POST (/research/process or /coding/process)
           v
+---------------------------------------+---------------------------------------+
| Laptop 3: Worker 1 (Port 8003)        | Laptop 4: Worker 2 (Port 8003)        |
| Coding Agent Node                     | Research Agent Node                   |
| - Code Generation & Synthesis         | - Web Search & Extraction (DDG/BS4)   |
| - Python Algorithm Solver             | - Document Analysis & Tool Router     |
+---------------------------------------+---------------------------------------+
```

### Roles & Responsibilities

| Machine | Role Name | Default Port | Primary Functions | Default Local Model |
| :--- | :--- | :--- | :--- | :--- |
| **Laptop 1** | `controller` | `8000` / `8501` | Gateway API (`/api/v1/query`), Router, Evaluator, Frontend Server | `qwen2.5:1.5b` |
| **Laptop 2** | `brain` | `8001` | Intent classification, Planner, Task DAG creation | `qwen3:8b` |
| **Laptop 3** | `worker_1` | `8003` | Code generation, algorithm implementation, code debugging | `qwen2.5-coder:7b` |
| **Laptop 4** | `worker_2` | `8003` | Web search (DuckDuckGo), text extraction, research synthesis | `qwen3:8b` |
| *Combined* | `workers` | `8003` | Single-machine worker running both Research + Coding + Tools | Multi-model |

---

## 2. Network Configuration

Before launching nodes on physical laptops, edit `config/network.yaml` with each laptop's actual LAN IP address:

```yaml
network:
  wifi_name: "YOUR_WIFI_SSID"
  internet_access: false
  default_node_port: 8000
  request_timeout_s: 120
  health_timeout_s: 3

laptops:
  controller:
    ip: "10.111.219.162"   # Replace with Laptop 1 LAN IP
    ui_port: 8501
  brain:
    ip: "10.111.219.143"   # Replace with Laptop 2 LAN IP
    port: 8001
  worker_1:
    ip: "10.111.219.14"    # Replace with Laptop 3 LAN IP
    port: 8003
  worker_2:
    ip: "10.111.219.48"    # Replace with Laptop 4 LAN IP
    port: 8003
```

*(Find your IP: `ipconfig` on Windows or `ip a` on Linux/macOS).*

---

## 3. Installation & Prerequisites

1. **Python**: Python 3.10+ installed on all machines.
2. **Ollama**: Installed and running on nodes hosting models (`ollama serve`). Pull the required models:
   ```bash
   ollama pull qwen3:8b
   ollama pull qwen2.5-coder:7b
   ollama pull qwen2.5:1.5b
   ```
3. **Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *(Or per-role requirements: `pip install -r requirements/common.txt`, etc.)*

---

## 4. Execution Commands

### A. Starting the Brain Node (Laptop 2)
On the machine designated as the Brain node:
```bash
python run_node.py --role brain
```
*Listens on `0.0.0.0:8001`. Exposes `/orchestrator/process` and `/planner/process`.*

---

### B. Starting the Worker Nodes

#### Option 1: Two Separate Worker Laptops (4-Laptop Deployment)
- **On Laptop 3 (Worker 1 - Coding Agent):**
  ```bash
  python run_node.py --role worker_1
  ```
  *Listens on `0.0.0.0:8003`. Exposes `/coding/process`.*

- **On Laptop 4 (Worker 2 - Research Agent):**
  ```bash
  python run_node.py --role worker_2
  ```
  *Listens on `0.0.0.0:8003`. Exposes `/research/process`.*

#### Option 2: Single Combined Worker Node
If running both coding and research on one laptop:
```bash
python run_node.py --role workers
```
*Listens on `0.0.0.0:8003`. Mounts `/research/process`, `/coding/process`, and `/tools/process`.*

---

### C. Starting the Controller Node & UI (Laptop 1)
On the machine designated as the Controller:
```bash
uvicorn controller.server:app --host 0.0.0.0 --port 8000
```
*(Or specify `--port 8501` to match your network config).*

This launches:
- **Unified REST API Gateway** at `http://<CONTROLLER_IP>:8000/api/v1/query`
- **Cluster Diagnostics API** at `http://<CONTROLLER_IP>:8000/api/v1/cluster`
- **Mission Control Web Dashboard** at `http://<CONTROLLER_IP>:8000/`

---

### D. Running Frontend in Live Development Mode (Optional)
If modifying the React frontend source code with Vite hot-reloading:
```bash
cd Frontend
npm install
npm run dev -- --host
```
- Access live UI at: `http://localhost:5173/static/`
- Vite automatically proxies `/api` calls to the Controller backend on port `8501`.

To compile changes into the production bundle served by the Controller:
```bash
cd Frontend
npm run build
Copy-Item -Path "dist\assets\*" -Destination "..\AgentVerse\frontend\assets\" -Force
```

---

## 5. Verification & Testing

### 1. Network Connectivity Check
Run the automated cluster probe script to test all node endpoints:
```bash
python scripts/network_check.py
```

### 2. Direct CLI Query Testing
Test individual agents directly over the LAN without opening the browser:
```bash
# Test Coding Agent
python scripts/mock_query.py --agent coding --query "Write a binary search in Python"

# Test Research Agent
python scripts/mock_query.py --agent research --query "Summarize quantum computing principles"
```

### 3. Cluster Health Status
Query the Controller's health probe:
```bash
curl http://localhost:8000/api/v1/cluster
```

---

## 6. Directory Structure

```
AgentVerse/
├── config/
│   ├── network.yaml           # Physical LAN IPs and cluster ports
│   ├── controller.yaml        # Routing rules and agent mode mappings
│   └── roles/                 # Node role definitions
│       ├── brain.yaml         # Orchestrator & Planner handlers
│       ├── worker_1.yaml      # Worker 1 (Coding) handlers
│       ├── worker_2.yaml      # Worker 2 (Research) handlers
│       └── workers.yaml       # Combined worker handlers
├── controller/
│   ├── server.py              # Unified FastAPI Gateway & Static UI server
│   ├── router.py              # Query classification and agent routing
│   └── main.py                # Legacy controller server
├── nodes/
│   ├── orchestrator/          # Brain supervisor & execution planner
│   ├── research/              # DuckDuckGo search & web research agent
│   ├── coding/                # Code synthesis agent & algorithmic fallback
│   └── tools/                 # Tool router (Web search, calculators)
├── common/
│   ├── schemas.py             # QueryRequest & QueryResponse Pydantic models
│   ├── llm.py                 # Async Ollama client with mock fallback
│   ├── http_client.py         # Inter-node HTTP communication client
│   ├── config_loader.py       # YAML configuration loader
│   └── registry.py            # Node discovery and registry mapping
├── frontend/                  # Compiled React production bundle
│   ├── index.html             # Entry point
│   └── assets/                # Minified JS & CSS bundles
├── Frontend/                  # Vite + React + Tailwind TypeScript source code
├── scripts/
│   ├── network_check.py       # Ping & health verification script
│   └── mock_query.py          # Command-line query dispatcher
├── run_node.py                # Generic node runner entrypoint (--role <name>)
├── requirements.txt           # Unified Python requirements
└── README.md                  # Project documentation
```

---

## 7. Troubleshooting

- **Error: `[winerror 10048] only one usage of each socket address`**:
  A previous instance of Uvicorn or another service is already using the port (e.g., `8003`). Terminate the process using:
  ```powershell
  # Find PID:
  Get-NetTCPConnection -LocalPort 8003 | Select-Object OwningProcess
  # Stop Process:
  Stop-Process -Id <PID> -Force
  ```
- **Connection Refused (`curl` / UI errors)**:
  1. Confirm that Windows Firewall allows Python/Uvicorn on the configured ports (`8000`, `8001`, `8003`).
  2. Verify all laptops are on the exact same Wi-Fi subnet.
  3. Ensure IP addresses in `config/network.yaml` match the current LAN IPs.