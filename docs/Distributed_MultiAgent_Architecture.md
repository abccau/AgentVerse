# Distributed Multi-Agent AI Platform Architecture

## Objective

Build a fully on-premise multi-agent AI system using 4 laptops connected through a private Local Area Network (LAN).

### Key Requirement

- No OpenAI API
- No Gemini API
- No Claude API
- No external AI services
- All models run locally
- All communication stays inside the organization's network

---

# Physical Network Topology

```text
                    WiFi Router / LAN Switch
                           |
    -------------------------------------------------
    |                    |                |          |
    |                    |                |          |
Laptop A            Laptop B         Laptop C   Laptop D
Research Node      Document Node    Analytics    Control Node
                                     Node
```

Example local IP addresses:

```text
Laptop A : 192.168.1.10
Laptop B : 192.168.1.11
Laptop C : 192.168.1.12
Laptop D : 192.168.1.13
```

All communication uses local IP addresses only.

---

# Node Responsibilities

## Laptop D (Control Node)

Hardware:
- Integrated Graphics

Services:
- User Interface
- Orchestrator Agent
- Planner Agent
- Evaluator Agent
- Response Generator
- Qdrant Vector Database
- Agent Registry

Responsibilities:
- Receive user requests
- Create execution plans
- Route tasks to agent nodes
- Collect results
- Validate outputs
- Generate final response

---

## Laptop A (Research Node)

Hardware:
- RTX 3050 6GB

Model:
- Qwen3:4B (or equivalent)

Agent:
- Research Agent

Responsibilities:
- Search knowledge sources
- Retrieve information
- Gather context
- Perform research tasks

API:

```text
POST /research
```

---

## Laptop B (Document Processing Node)

Hardware:
- RTX 3050 6GB

Model:
- Qwen3:4B (or equivalent)

Agent:
- Document Analysis Agent

Responsibilities:
- PDF analysis
- Summarization
- Information extraction
- RAG reasoning

API:

```text
POST /document
```

---

## Laptop C (Analytics Node)

Hardware:
- RTX 3050 6GB

Model:
- Qwen3:4B (or equivalent)

Agents:
- Code Agent
- Database Agent
- Data Analysis Agent

Responsibilities:
- SQL generation
- Data analysis
- Code generation
- Repository auditing

APIs:

```text
POST /code
POST /database
POST /analysis
```

---

# Communication Architecture

All nodes expose REST APIs using FastAPI.

Example:

```text
Laptop A
http://192.168.1.10:8000/research

Laptop B
http://192.168.1.11:8000/document

Laptop C
http://192.168.1.12:8000/code
```

The Orchestrator communicates directly with each node through HTTP requests inside the LAN.

No internet traffic is required.

---

# Execution Flow

Example User Request:

```text
Analyze this report and generate SQL insights.
```

Workflow:

```text
User
 |
 v
Orchestrator
 |
 v
Planner
 |
 +-------------------+
 |                   |
 v                   v
Document Agent   Database Agent
(Laptop B)       (Laptop C)
 |                   |
 +--------+----------+
          |
          v
      Evaluator
          |
          v
 Response Generator
          |
          v
         User
```

---

# Agent Discovery

The Control Node maintains an Agent Registry.

Example:

```json
{
  "research": "192.168.1.10:8000",
  "document": "192.168.1.11:8000",
  "database": "192.168.1.12:8000",
  "code": "192.168.1.12:8000",
  "analysis": "192.168.1.12:8000"
}
```

The Planner uses this registry to select agents dynamically.

---

# Data Privacy Model

All components remain inside the organization's infrastructure.

```text
Enterprise Network

├── User Requests
├── AI Models
├── Documents
├── Vector Database
├── Memory
├── Agent Communication
└── Generated Responses
```

Nothing leaves the private network.

Benefits:

- Complete data ownership
- Reduced compliance risk
- No third-party AI dependency
- No exposure of confidential documents
- Suitable for enterprise deployments

---

# Future Scalability

New capabilities can be added by introducing additional nodes.

Example:

```text
Laptop E -> Vision Agent
Laptop F -> Finance Agent
Laptop G -> Legal Agent
```

The Orchestrator and Planner remain unchanged.

Only a new agent registration is required.

---

# Project Positioning

This system demonstrates a distributed, on-premise, multi-agent AI architecture where specialized AI models collaborate through a private LAN. The architecture is model-agnostic and can scale from lightweight open-source models used in development to larger enterprise-grade models in production environments.
