from typing import TypedDict, List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentTask(BaseModel):
    task_id: str
    target_agent: str
    target_node: str  # laptop_a, laptop_b, laptop_c, or laptop_d
    instruction: str
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    dependencies: List[str] = Field(default_factory=list)
    result: Optional[Dict[str, Any]] = None

class EvaluationResult(BaseModel):
    score: float = 0.0
    passed: bool = False
    feedback: str = ""
    issues: List[str] = Field(default_factory=list)

class AgentVerseState(TypedDict):
    session_id: str
    user_query: str
    source_client_ip: Optional[str]
    chat_history: List[Dict[str, str]]
    plan: List[Dict[str, Any]]
    current_step_index: int
    agent_artifacts: Dict[str, Any]
    cluster_dispatch_log: List[Dict[str, Any]]
    evaluation: Optional[Dict[str, Any]]
    final_response: Optional[str]
    error_logs: List[str]
