# Agentverse

Agentverse is a generic, domain-independent multi-agent artificial intelligence platform designed to dynamically orchestrate specialized agents, RAG, memory, and tools to solve diverse user tasks.

## Project Scope

![Updated Project Scope](docs/Updated%20Project%20Scope.png)

## System Architecture

![Architecture](docs/Architecture.png)

## Technology Stack

- **Backend Framework:** FastAPI
- **Agent Orchestration:** LangGraph (Stateful, multi-actor workflows)
- **Document Ingestion & Processing:** Langchain
- **Vector Database:** Qdrant (Deployed via Docker)
- **Local Language Models:** Specific Ollama models tailored for individual agents
- **Memory Management:** Long-term conversation state persistence

## Core Features

- **Dynamic Task Execution:** An Orchestrator and Planner agent work together to break down complex tasks and route subtasks to appropriate specialized agents.
- **Specialized Agents:** Dedicated intelligence modules for:
  - Web Research
  - Document Analysis (PDF parsing, summarization)
  - Data Analysis (Dataset processing)
  - Code Generation & Debugging
- **Enterprise RAG:** Seamlessly ingest, chunk, embed, and query internal documents using Langchain and Qdrant.
- **Evaluator Layer:** Output verification, contradiction detection, and response scoring to ensure high-quality, reliable outputs before presenting them to the user.
- **Tool Integration:** Robust tool-calling capabilities including web search utilities, code execution environments, and file processors.

## General File Structure

```text
AgentVerse/
├── agents/                      # Specialized agent creation and LangGraph definitions
│   ├── orchestrator/            # Central coordinator LangGraph definitions (Supervises routing)
│   ├── planner/                 # Planner agent logic to break down tasks
│   ├── rag/                     # RAG specialized agents
│   └── evaluation/              # Evaluator agent logic (verification and scoring)
├── backend/                     # FastAPI core backend application
│   ├── main.py                  # FastAPI application entry point
│   ├── api.py                   # API routes and endpoints definition
│   └── config.py                # Configuration (Models, Qdrant endpoints, API keys)
├── database/                    # Vector database configurations and scripts
│   ├── docker-compose.yml       # Qdrant vector database docker setup
│   └── qdrant_client.py         # Qdrant client interactions and connection handling
├── docs/                        # Project documentation (Architecture, Implementation Plan)
├── frontend/                    # Frontend UI application
├── memory/                      # Long-term memory and conversation state management
│   ├── state.py                 # LangGraph state definitions
│   └── history.py               # Saving and loading chat history
├── tests/                       # Automated tests (Functional, Multi-agent, RAG, Performance)
└── tools/                       # Tool definitions for LangGraph agents
    ├── search_tools.py          # Web search utilities
    ├── code_tools.py            # Code execution environments
    └── document_tools.py        # Langchain ingestion and chunking logic
```

## Getting Started

*(Instructions for local setup, bringing up the Qdrant Docker container, installing Python dependencies, and starting the FastAPI server will be added as implementation progresses.)*
