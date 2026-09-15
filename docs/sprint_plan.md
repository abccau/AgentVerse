# Agentverse: 4-Developer Sprint-Wise Implementation Plan

## Executive Overview

This document outlines the phased, sprint-by-sprint development plan for building **Agentverse** with a dedicated team of **4 Developers**. 

The division of responsibilities maps directly to our **Distributed Multi-Agent Architecture** (Control Node, Document Processing Node, Research Node, and Analytics/Code Node), ensuring that each developer operates as an autonomous module lead while adhering to strict shared data contracts (LangGraph State).

---

## Team Roles & Domain Ownership

```
+---------------------------------------------------------------------------------------------------------+
|                                    Agentverse Team Assignment Matrix                                    |
+---------------+------------------------+--------------------------+-------------------------------------+
| Role          | Developer Title        | Primary Hardware / Node  | Core Domains & Services             |
+---------------+------------------------+--------------------------+-------------------------------------+
| Developer 1   | Core & Orchestration   | Laptop D (Control Node)  | Orchestrator, Planner, Evaluator,    |
| (Lead)        | Lead                   |                          | Gateway API, LangGraph State        |
+---------------+------------------------+--------------------------+-------------------------------------+
| Developer 2   | Knowledge & Document   | Laptop B (Document Node) | Document Analysis Agent, Ingestion, |
|               | Lead                   |                          | Qdrant Vector DB, Enterprise RAG    |
+---------------+------------------------+--------------------------+-------------------------------------+
| Developer 3   | Research & Search Lead | Laptop A (Research Node) | Research Agent, Web Tools, Scraping,|
|               |                        |                          | Fact Verification & Triangulation   |
+---------------+------------------------+--------------------------+-------------------------------------+
| Developer 4   | Analytics & Code Lead  | Laptop C (Analytics Node)| Data Analysis Agent, Code Agent,    |
|               |                        |                          | Python REPL Sandbox, Visualizations |
+---------------+------------------------+--------------------------+-------------------------------------+
```

---

## Master Sprint Timeline

| Sprint | Duration | Primary Milestone | Key Outcome |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Weeks 1–2 | Foundation, State Contracts & Tool Scaffolds | Shared LangGraph state, Qdrant setup, baseline tools, API gateway |
| **Sprint 2** | Weeks 3–4 | Autonomous Agent Logic & Local LLM Integration | Individual agents functioning autonomously with local Ollama models |
| **Sprint 3** | Weeks 5–6 | Orchestration DAG, Evaluation Loop & Synthesis | End-to-end LangGraph supervisor flow with automated quality scoring |
| **Sprint 4** | Weeks 7–8 | Distributed Multi-Node LAN Deployment | 4 laptops communicating over private LAN via FastAPI REST endpoints |
| **Sprint 5** | Weeks 9–10 | Frontend UI, Stress Testing & Final Demonstration | Web chat UI, streaming tokens, scenario benchmarking, final release |

---

# Sprint 1: Foundation, State Contracts & Tool Scaffolds

### Sprint Goal
Establish the repository structure, standard interfaces, shared LangGraph TypedDict state, Qdrant vector database container, and isolated utility toolkits.

---

### Developer 1: Core & Orchestration Lead
*Focus: Shared LangGraph State, Configuration & FastAPI Gateway*

#### 1. File to Create: `memory/state.py`
- **Logic & Implementation:**
  - Define the global state schema using `typing.TypedDict` and Pydantic models.
  - Define `AgentTask`: `task_id`, `agent_type`, `instruction`, `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`), `dependencies` (`list[str]`), `result` (`Optional[dict]`).
  - Define `EvaluationResult`: `score` (`float`), `passed` (`bool`), `feedback` (`str`), `issues` (`list[str]`).
  - Define `AgentVerseState`:
    ```python
    class AgentVerseState(TypedDict):
        session_id: str
        user_query: str
        chat_history: list[dict]
        plan: list[AgentTask]
        current_step_index: int
        agent_artifacts: dict[str, Any]  # Keyed by task_id/agent_name
        evaluation: Optional[EvaluationResult]
        final_response: Optional[str]
        error_logs: list[str]
    ```

#### 2. File to Create: `backend/config.py`
- **Logic & Implementation:**
  - Load environment variables using `pydantic-settings`.
  - Define Ollama host addresses, default model names (`qwen2.5:7b`, `deepseek-coder:6.7b`, `nomic-embed-text`), Qdrant host/port, and LAN node IP endpoints (`NODE_A_URL`, `NODE_B_URL`, `NODE_C_URL`).

#### 3. File to Create: `backend/main.py` & `backend/api.py`
- **Logic & Implementation:**
  - Initialize FastAPI app with CORS middleware and health-check endpoints (`GET /health`).
  - Scaffold initial endpoint `POST /api/v1/query` to receive `{ "query": str, "session_id": Optional[str] }`.
  - Stub session initialization and invoke LangGraph runner mock.

---

### Developer 2: Knowledge & Document Lead
*Focus: Qdrant Setup, Document Ingestion & Chunking Pipeline*

#### 1. File to Create: `database/docker-compose.yml`
- **Logic & Implementation:**
  - Docker Compose file configuring `qdrant/qdrant:latest` with port mappings `6333:6333` (REST) and `6334:6334` (gRPC).
  - Configure persistent storage volume at `./qdrant_data`.

#### 2. File to Create: `database/qdrant_client.py`
- **Logic & Implementation:**
  - Class `QdrantVectorStore`:
    - `__init__(self, host: str, port: int)`: Connects via `qdrant_client.QdrantClient`.
    - `create_collection(self, collection_name: str, vector_size: int = 768)`: Creates collection with Cosine distance.
    - `upsert_documents(self, collection_name: str, vectors: list[list[float]], payloads: list[dict])`: Batched point upsert.
    - `similarity_search(self, collection_name: str, query_vector: list[float], limit: int = 5) -> list[dict]`: Nearest neighbor query returning chunks and metadata.

#### 3. File to Create: `tools/document_tools.py`
- **Logic & Implementation:**
  - `load_document(file_path: str) -> list[Document]`: Supports `.pdf` (using `pypdf`/`pdfplumber`), `.docx`, and `.txt`.
  - `chunk_document(docs: list[Document], chunk_size: int = 800, chunk_overlap: int = 150) -> list[Document]`: Applies `RecursiveCharacterTextSplitter`.
  - Extract document metadata (filename, page numbers, total pages).

---

### Developer 3: Research & Search Lead
*Focus: Search Toolkits, Web Scraping & URL Content Extraction*

#### 1. File to Create: `tools/search_tools.py`
- **Logic & Implementation:**
  - Class `WebSearchTool`:
    - `search(query: str, max_results: int = 5) -> list[dict]`: Connects to `duckduckgo_search` (`DDGS`) or local SearxNG instance. Returns `[{"title": str, "url": str, "snippet": str}]`.
    - Query sanitization and rate-limit handling with exponential backoff.
  - Class `URLReaderTool`:
    - `fetch_page_content(url: str, timeout: int = 10) -> str`: Fetches page content using `httpx` or `requests`.
    - Cleans page with `BeautifulSoup` to strip `<script>`, `<style>`, `<nav>`, and advertisements.
    - Returns structured markdown text capped at token limits (e.g., 4000 characters).

#### 2. File to Create: `agents/research/__init__.py` & `agents/research/state.py`
- **Logic & Implementation:**
  - Define local data structures for research queries: `ResearchInput(query, constraints)` and `ResearchOutput(brief, sources, key_findings)`.

---

### Developer 4: Analytics & Code Lead
*Focus: Python Execution Sandbox & Code Tools*

#### 1. File to Create: `tools/code_tools.py`
- **Logic & Implementation:**
  - Class `PythonREPLSandbox`:
    - `execute_code(code: str, timeout: int = 15) -> dict`: Executes Python code inside a restricted subprocess (`subprocess.run`).
    - Captures `stdout`, `stderr`, and return code.
    - Sets hard memory and timeout constraints to prevent infinite loops or memory crashes.
    - Blocks dangerous system operations (`os.system`, `shutil.rmtree`, formatting drives).
  - `validate_syntax(code: str) -> tuple[bool, Optional[str]]`: Uses Python's native `ast.parse` to verify syntactic correctness before execution.

#### 2. File to Create: `tools/data_tools.py`
- **Logic & Implementation:**
  - `load_tabular_data(file_path: str) -> pd.DataFrame`: Reads CSV, Excel, or JSON files into Pandas.
  - `get_dataset_summary(df: pd.DataFrame) -> dict`: Computes column names, data types, missing value percentages, and numerical statistics (`describe()`).

---

### Sprint 1 Integration Deliverable
- Running `docker compose up -d` brings up Qdrant.
- Running `python -m backend.main` starts FastAPI with `/health` returning `200 OK`.
- Unit tests verify document chunking, search queries, and code sandbox execution in isolation.

---

# Sprint 2: Core Agent Intelligence & Local LLM Integration

### Sprint Goal
Connect each agent to local Ollama LLMs and implement their autonomous decision-making loops.

---

### Developer 1: Core & Orchestration Lead
*Focus: Planner Agent & Orchestrator Supervisor Graph*

#### 1. File to Create: `agents/planner/planner.py`
- **Logic & Implementation:**
  - Connects to Ollama (`qwen2.5:7b` or `llama3.1:8b`).
  - System prompt instructs model to act as Chief AI Architect.
  - `decompose_task(user_query: str, available_agents: list[str]) -> list[AgentTask]`:
    - Parses user goal into ordered steps.
    - Specifies dependencies between steps (e.g., Document Analysis must complete before Data Analysis).
    - Emits clean JSON adhering to Pydantic `PlanOutput` schema.

#### 2. File to Create: `agents/orchestrator/supervisor.py`
- **Logic & Implementation:**
  - Initializes the LangGraph `StateGraph(AgentVerseState)`.
  - `orchestrator_node(state: AgentVerseState) -> dict`: Inspects `plan` and `current_step_index`.
  - Implements dynamic routing condition `route_next_agent(state) -> str` which reads the target agent of the active step and transitions the graph to that node.
  - Increments `current_step_index` upon subtask resolution.

---

### Developer 2: Knowledge & Document Lead
*Focus: Document Analysis Agent & Enterprise RAG Agent*

#### 1. File to Create: `agents/rag/embedding.py`
- **Logic & Implementation:**
  - Class `LocalEmbedder`: Calls Ollama embeddings API (`/api/embeddings`) using `nomic-embed-text` or `bge-m3`. Generates dense 768/1024-dimensional vectors.
  - Caches embeddings in memory to prevent duplicate requests.

#### 2. File to Create: `agents/rag/rag_agent.py`
- **Logic & Implementation:**
  - `retrieve_context(query: str, top_k: int = 4) -> list[str]`:
    - Embeds `query` with `LocalEmbedder`.
    - Queries Qdrant collection via `similarity_search`.
    - Formats retrieved chunks with file name and score into an augmented context string.

#### 3. File to Create: `agents/document/document_agent.py`
- **Logic & Implementation:**
  - `analyze_document(file_path: str, instruction: str) -> dict`:
    - Ingests file via `load_document` and chunks via `chunk_document`.
    - If document is short (< 4000 tokens), passes directly to LLM for full analysis.
    - If long (> 4000 tokens), indexes chunks into Qdrant temporary collection, runs RAG retrieval against `instruction`, and prompts LLM to generate targeted summary with page citations.

---

### Developer 3: Research & Search Lead
*Focus: Autonomous Research Agent & Fact Triangulation*

#### 1. File to Create: `agents/research/research_agent.py`
- **Logic & Implementation:**
  - `execute_research(topic: str, max_sources: int = 3) -> dict`:
    - Step 1: LLM generates 2–3 targeted search queries based on the broad topic.
    - Step 2: Executes queries using `WebSearchTool.search()`.
    - Step 3: Selects top URLs and scrapes content with `URLReaderTool`.
    - Step 4: Prompts LLM to synthesize gathered pages:
      - Extracts key facts, statistics, and verifiable claims.
      - Discards commercial fluff or irrelevant text.
    - Step 5: Outputs structured markdown with explicit inline citations `[Source 1](url)`.

---

### Developer 4: Analytics & Code Lead
*Focus: Data Analysis Agent & Autonomous Code Agent*

#### 1. File to Create: `agents/data_analysis/data_agent.py`
- **Logic & Implementation:**
  - `analyze_data(file_path: str, user_request: str) -> dict`:
    - Loads dataset with `load_tabular_data` and extracts schema summary.
    - Prompts local LLM with schema + request to generate Pandas transformation code.
    - Executes code via `PythonREPLSandbox`.
    - If code errors, feeds `stderr` back into LLM to self-heal (max 2 retries).
    - Returns computed statistics and textual insights.

#### 2. File to Create: `agents/code/code_agent.py`
- **Logic & Implementation:**
  - `develop_code(instruction: str, language: str = "python") -> dict`:
    - Prompts Code LLM (`deepseek-coder:6.7b` or `qwen2.5-coder:7b`).
    - Synthesizes implementation code + corresponding unit tests.
    - Validates syntax using `validate_syntax`.
    - Executes tests in sandbox.
    - If test fails, parses traceback, edits code, and re-tests.
    - Returns final verified code snippet and test report.

---

### Sprint 2 Integration Deliverable
- Developer 1 can trigger each specialized agent locally via Python functions and see them complete their dedicated tasks using local Ollama models.

---

# Sprint 3: Quality Control, Evaluator Loop & LangGraph Wiring

### Sprint Goal
Wire all agents into a unified LangGraph state machine on Developer 1's machine, adding the Evaluator quality gate and response generator.

---

### Developer 1: Core & Orchestration Lead
*Focus: Evaluator Agent, Response Generator & State Machine Assembly*

#### 1. File to Create: `agents/evaluation/evaluator.py`
- **Logic & Implementation:**
  - System prompt defines an impartial Judge LLM.
  - `evaluate_execution(state: AgentVerseState) -> EvaluationResult`:
    - Compares original `user_query` against `agent_artifacts`.
    - Checks 4 criteria: Relevance (0-25), Factual Consistency (0-25), Completeness (0-25), Formatting (0-25).
    - Total Score = Sum of criteria (0–100).
    - If `Score >= 80`, returns `passed=True`.
    - If `Score < 80`, returns `passed=False` with specific constructive feedback in `feedback`.

#### 2. File to Create: `agents/evaluation/generator.py`
- **Logic & Implementation:**
  - `generate_final_response(state: AgentVerseState) -> str`:
    - Combines all outputs from `agent_artifacts`.
    - Cleans internal agent jargon (removes `step_1`, `task_id`).
    - Produces clean GitHub-flavored markdown with headers, bullet points, code blocks, and source citations.

#### 3. File to Update: `agents/orchestrator/graph.py`
- **Logic & Implementation:**
  - Assembles the complete LangGraph:
    - Nodes: `planner`, `research`, `document`, `data_analysis`, `code`, `evaluator`, `generator`.
    - Conditional Edge from `evaluator`:
      - If `passed == True` → Navigate to `generator` → `END`.
      - If `passed == False` and `retry_count < 2` → Increment `retry_count` and route back to `orchestrator` or targeted agent.
      - If `retry_count >= 2` → Route to `generator` with warning flag.

---

### Developer 2: Knowledge & Document Lead
*Focus: Cross-Encoder Re-Ranking & Document Table Extraction*

#### 1. File to Update: `agents/rag/rag_agent.py`
- **Logic & Implementation:**
  - Implement reciprocal rank fusion (RRF) or cross-encoder re-ranking for top retrieved chunks.
  - Deduplicate overlapping chunks to maximize LLM context window efficiency.

#### 2. File to Update: `tools/document_tools.py`
- **Logic & Implementation:**
  - Add explicit table extraction support using `pdfplumber` to extract tables into structured Markdown/CSV strings.

---

### Developer 3: Research & Search Lead
*Focus: Fact Triangulation & Search Cache*

#### 1. File to Update: `agents/research/research_agent.py`
- **Logic & Implementation:**
  - Implement cross-verification: If source A makes a numerical claim, agent attempts to confirm against source B.
  - Add local SQLite or JSON caching (`memory/search_cache.json`) to avoid repeated external queries for identical search terms.

---

### Developer 4: Analytics & Code Lead
*Focus: Chart Generation & Multi-step Data Reporting*

#### 1. File to Update: `agents/data_analysis/data_agent.py`
- **Logic & Implementation:**
  - Add Matplotlib/Seaborn plot generation logic.
  - Plots are saved as PNG files under `frontend/static/charts/` or converted to base64 strings and attached to the state artifacts.

#### 2. File to Update: `tools/code_tools.py`
- **Logic & Implementation:**
  - Add multi-file sandbox support (allowing agents to generate a main script and import helper files).

---

### Sprint 3 Integration Deliverable
- A complete query (e.g. *"Analyze this CSV data, research competitors, and write a summary report"*) runs through the full local LangGraph: Planner → Agents → Evaluator → Generator → Final Output.

---

# Sprint 4: Distributed Multi-Node LAN Deployment

### Sprint Goal
Distribute the system across 4 laptops on the private Local Area Network (192.168.1.x) with no internet or cloud API dependencies.

---

### Developer 1: Control Node Lead (Laptop D - 192.168.1.13)
*Focus: Node Registry & Remote HTTP Agent Dispatcher*

#### 1. File to Create: `backend/registry.py`
- **Logic & Implementation:**
  - Manages node directory:
    ```python
    NODE_REGISTRY = {
        "research": "http://192.168.1.10:8000",
        "document": "http://192.168.1.11:8000",
        "data_analysis": "http://192.168.1.12:8000",
        "code": "http://192.168.1.12:8000"
    }
    ```
  - Includes heartbeat health checker pinging `GET {node_url}/health` every 30 seconds.

#### 2. File to Create: `agents/orchestrator/remote_dispatcher.py`
- **Logic & Implementation:**
  - Replaces direct function calls in LangGraph with asynchronous HTTP calls (`httpx.AsyncClient`).
  - Serializes task payload into JSON `POST {node_url}/execute`.
  - Implements 60-second timeouts and automatic fallback/retry logic if a node drops offline.

---

### Developer 2: Document Processing Node Lead (Laptop B - 192.168.1.11)
*Focus: Standalone Document Node Microservice*

#### 1. File to Create: `backend/nodes/document_node.py`
- **Logic & Implementation:**
  - Standalone FastAPI application running on port `8000`.
  - Exposes:
    - `GET /health`: Node status & GPU/VRAM load.
    - `POST /document/analyze`: Ingests file payload or path, executes Document Analysis Agent, returns extracted insights.
    - `POST /document/rag`: Executes vector search & retrieval.

---

### Developer 3: Research Node Lead (Laptop A - 192.168.1.10)
*Focus: Standalone Research Node Microservice*

#### 1. File to Create: `backend/nodes/research_node.py`
- **Logic & Implementation:**
  - Standalone FastAPI application running on port `8000`.
  - Exposes:
    - `GET /health`: Node status.
    - `POST /research/execute`: Receives query and search constraints, runs Research Agent, returns synthesized findings and URLs.

---

### Developer 4: Analytics Node Lead (Laptop C - 192.168.1.12)
*Focus: Standalone Analytics & Code Node Microservice*

#### 1. File to Create: `backend/nodes/analytics_node.py`
- **Logic & Implementation:**
  - Standalone FastAPI application running on port `8000`.
  - Exposes:
    - `GET /health`: Node status.
    - `POST /data/analyze`: Runs Data Analysis Agent on dataset payloads.
    - `POST /code/develop`: Runs Code Agent to generate and test code in sandbox.

---

### Sprint 4 Integration Deliverable
- Laptop D dispatches tasks to Laptops A, B, and C over the LAN router switch.
- Orchestrator collects remote JSON responses and successfully feeds them through the Evaluator and Response Generator.

---

# Sprint 5: Frontend UI, Stress Testing & Final Demonstration

### Sprint Goal
Build the user-facing web interface, stream responses in real-time, execute multi-agent scenario benchmarks, and harden system reliability.

---

### Developer 1: Core & Orchestration Lead
*Focus: Streaming Endpoints & Web Chat Interface*

#### 1. File to Create: `frontend/index.html`, `frontend/app.js`, `frontend/style.css`
- **Logic & Implementation:**
  - Responsive, modern dark-themed chat interface.
  - Displays live multi-agent execution pipeline status badges:
    `[Planner Active] → [Researching (Node A)] → [Document Parsing (Node B)] → [Evaluating] → [Complete]`
  - Renders markdown, code syntax highlighting (`Prism.js`/`Highlight.js`), and chart images.

#### 2. File to Update: `backend/api.py`
- **Logic & Implementation:**
  - Add WebSocket endpoint `/ws/chat` or SSE endpoint `/api/v1/stream` for real-time token streaming and step updates.

---

### Developer 2: Knowledge & Document Lead
*Focus: RAG Benchmark & File Upload Pipeline*

#### 1. File to Create: `tests/test_rag_pipeline.py`
- **Logic & Implementation:**
  - Automated test suite benchmarking retrieval precision, recall, and answer grounding on complex 50+ page PDFs.
  - Validates document ingestion throughput (pages/sec) and Qdrant memory consumption.

---

### Developer 3: Research & Search Lead
*Focus: Research Benchmarking & Failover Testing*

#### 1. File to Create: `tests/test_research_agent.py`
- **Logic & Implementation:**
  - Evaluates search agent across 10 diverse research questions.
  - Tests network timeout handling when internet is deliberately throttled or blocked.

---

### Developer 4: Analytics & Code Lead
*Focus: Sandbox Security & End-to-End Analytics Tests*

#### 1. File to Create: `tests/test_sandbox_security.py`
- **Logic & Implementation:**
  - Runs adversarial code injection tests against `PythonREPLSandbox` (e.g. attempting to read host files or spawn unauthorized child processes).
  - Verifies that malicious code is rejected and handled gracefully.

#### 2. File to Create: `tests/test_e2e_scenarios.py`
- **Logic & Implementation:**
  - End-to-end integration tests for the 6 core presentation scenarios (Research Assistance, Document Analysis, Programming Support, Data Analysis, Enterprise Knowledge Retrieval).

---

### Sprint 5 Integration Deliverable
- Fully functional multi-agent AI system operating on 4 laptops.
- User submits complex prompts via Web UI, watches the agent pipeline execute live, and receives validated answers and visualizations.

---

## File Creation Master Checklist by Developer

```text
Developer 1 (Core & Control Lead):
├── memory/state.py                   [Sprint 1]
├── backend/config.py                 [Sprint 1]
├── backend/main.py                   [Sprint 1]
├── backend/api.py                    [Sprint 1]
├── agents/planner/planner.py         [Sprint 2]
├── agents/orchestrator/supervisor.py [Sprint 2]
├── agents/evaluation/evaluator.py    [Sprint 3]
├── agents/evaluation/generator.py    [Sprint 3]
├── agents/orchestrator/graph.py      [Sprint 3]
├── backend/registry.py               [Sprint 4]
├── agents/orchestrator/remote_dispatcher.py [Sprint 4]
├── frontend/index.html               [Sprint 5]
├── frontend/app.js                   [Sprint 5]
└── frontend/style.css                [Sprint 5]

Developer 2 (Knowledge & Document Lead):
├── database/docker-compose.yml       [Sprint 1]
├── database/qdrant_client.py         [Sprint 1]
├── tools/document_tools.py           [Sprint 1]
├── agents/rag/embedding.py           [Sprint 2]
├── agents/rag/rag_agent.py           [Sprint 2]
├── agents/document/document_agent.py [Sprint 2]
├── backend/nodes/document_node.py    [Sprint 4]
└── tests/test_rag_pipeline.py        [Sprint 5]

Developer 3 (Research & Web Lead):
├── tools/search_tools.py             [Sprint 1]
├── agents/research/__init__.py       [Sprint 1]
├── agents/research/state.py          [Sprint 1]
├── agents/research/research_agent.py [Sprint 2]
├── memory/search_cache.json          [Sprint 3]
├── backend/nodes/research_node.py    [Sprint 4]
└── tests/test_research_agent.py      [Sprint 5]

Developer 4 (Analytics & Code Lead):
├── tools/code_tools.py               [Sprint 1]
├── tools/data_tools.py               [Sprint 1]
├── agents/data_analysis/data_agent.py[Sprint 2]
├── agents/code/code_agent.py         [Sprint 2]
├── backend/nodes/analytics_node.py   [Sprint 4]
├── tests/test_sandbox_security.py    [Sprint 5]
└── tests/test_e2e_scenarios.py       [Sprint 5]
```

---

## Daily Standup & Git Collaboration Protocol

1. **Branching Strategy:**
   - `main`: Production-ready, stable releases.
   - `dev`: Primary integration branch.
   - `feat/dev1-orchestrator`, `feat/dev2-rag-doc`, `feat/dev3-research`, `feat/dev4-analytics`: Individual feature branches.
2. **Pull Request (PR) Policy:**
   - Every PR must pass unit tests and must be reviewed by at least one other developer.
   - Developer 1 reviews all changes affecting `memory/state.py` to prevent state schema breaking changes.
3. **Daily Sync:**
   - 15-minute daily standup to report: (1) Yesterday's completed files, (2) Today's planned files/logic, (3) Blockers/dependencies on other nodes.
