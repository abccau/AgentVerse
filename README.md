# Distributed Multi-Agent AI Platform (4 Laptops, Offline LAN)

This project implements a multi-agent AI system split across four laptops on the same WiFi network. Currently, only the foundational communication, configuration mechanisms, and simple agents are implemented. Advanced knowledge features like RAG, Vector DB (Chroma/Qdrant), and complex Document Analysis will be added later.

## 1. Project Overview

The system consists of:
- **Controller (Laptop A):** Streamlit UI, Query Router
- **Brain (Laptop B):** Orchestrator, Planner
- **Workers (Laptop C & D):** Research Agent, Coding Agent, Tools (Calculator, **Websearch**)

Communication is handled via HTTP endpoints defined dynamically by `.yaml` configurations.

### Ports Used:
- `8001`, `8002`, `8003`: Nodes running FastAPI + Uvicorn
- `8501`: Controller Streamlit UI
- `11434`: Ollama running locally

---

## 2. Architecture & Components

- **Common (`common/`):** Defines `QueryRequest` and `QueryResponse` Pydantic schemas, HTTP clients, and configuration loaders.
- **Controller (`controller/`):** Streamlit UI and Regex/Mode based router.
- **Nodes (`nodes/`):**
  - `orchestrator`: Base supervisor logic.
  - `research`: Simulates LLM based research.
  - `coding`: Generates requested code using Code LLMs.
  - `tools`: Houses simple tools like a calculator and a websearch feature.

*Note: The frontend folder is completely untouched as per project requirements.*

---

## 3. Web Search Tool

A web search tool is integrated within `nodes/tools/tool_router.py`. When a user query matches keywords like "search" or "websearch", the query is routed to the Tools agent, which handles the request and returns a simulated or actual search result based on the environment constraints.

---

## 4. Running the Project

To run this project, you need Python 3.10+ installed. This guide assumes you are running the platform across a single local machine for testing, or multiple machines configured in `config/network.yaml`.

### Step 1: Install Dependencies
Open a terminal in the root of the project and run:
```bash
pip install -r requirements/common.txt
pip install -r requirements/brain.txt
pip install -r requirements/workers.txt
pip install -r requirements/controller.txt
```

### Step 2: Start the Nodes

Open three separate terminals (or configure them on separate laptops). Start the Brain node and Worker nodes.

**Terminal 1 (Brain Node):**
```bash
python run_node.py --role brain
```

**Terminal 2 (Workers Node):**
```bash
python run_node.py --role workers
```

*(You can verify the nodes are running and can communicate by executing the health check script in another terminal: `python scripts/network_check.py`)*

### Step 3: Start the Controller (UI)

**Terminal 3 (Controller):**
```bash
uvicorn controller.main:app --port 8501
```

### Step 4: Interact with the System
1. Open your browser to the URL provided by Uvicorn (typically `http://127.0.0.1:8501`).
2. Use the **Mode** dropdown in the sidebar to route your request to a specific agent (e.g., Code, Research), or leave it on Auto.
3. Type queries like "Write a python function" (will automatically route to Code) or "websearch the latest AI news" (will route to Tools).

### CLI Testing (Optional)
You can directly test agents without the UI using the mock query script:
```bash
python scripts/mock_query.py --agent coding --query "Write a hello world in Python"
```
