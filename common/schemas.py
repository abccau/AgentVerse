from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any

class QueryRequest(BaseModel):
    request_id: str
    query: str
    session_id: Optional[str] = None
    context: dict = Field(default_factory=dict)
    # context keys:
    # "history": list of {"role": "user"|"assistant", "content": str}
    # "previous_results": dict of step_id -> answer text

class QueryResponse(BaseModel):
    request_id: str
    node: str
    status: Literal["success", "error", "partial"]
    answer: str
    metadata: dict = Field(default_factory=dict)

class PlanStep(BaseModel):
    id: str
    agent: Literal["research", "coding", "tools"]
    task: str
    depends_on: List[str] = Field(default_factory=list)

class Plan(BaseModel):
    complexity: Literal["simple", "complex"]
    steps: List[PlanStep]
