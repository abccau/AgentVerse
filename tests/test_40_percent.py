import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.planner.planner import PlannerAgent
from agents.research.research_agent import ResearchAgent
from agents.rag.rag_agent import DocumentRAGAgent
from agents.data_analysis.data_agent import DataAnalysisAgent
from agents.code.code_agent import CodeAgent

def test_full_40_percent_pipeline():
    print("=" * 70)
    print("[TEST] RUNNING 40% IMPLEMENTATION SYSTEM TEST")
    print("=" * 70)

    # 1. Test Planner Decomposition (Laptop D)
    planner = PlannerAgent()
    query = "Analyze quarterly sales data, search for competitor trends in 2025, and write a Python forecasting script."
    plan = planner.plan_query(query)
    print(f"\n1. Planner Subtask Plan ({len(plan)} tasks generated):")
    for task in plan:
        print(f"   - [{task['target_agent'].upper()}] -> {task['assigned_pc']} (Deps: {task['dependencies']})")
    assert len(plan) >= 3, "Planner should generate at least 3 subtasks"

    # 2. Test Research Agent (Laptop A)
    researcher = ResearchAgent()
    res_out = researcher.run("Latest DeepSeek V3 architectural advantages")
    print(f"\n2. Research Agent Execution (Laptop A):")
    print(f"   Status: {res_out['status']} | Citations: {len(res_out['citations'])}")
    assert res_out["status"] == "COMPLETED"

    # 3. Test Document & RAG Agent (Laptop B)
    rag_agent = DocumentRAGAgent()
    rag_out = rag_agent.retrieve("What are the quarterly financial highlights?")
    print(f"\n3. Document & RAG Agent Execution (Laptop B):")
    print(f"   Retrieved {len(rag_out['matched_chunks'])} grounded context chunks")
    assert len(rag_out["matched_chunks"]) > 0

    # 4. Test Data Analysis Agent (Laptop C)
    data_agent = DataAnalysisAgent()
    data_out = data_agent.analyze_dataset(None, "Calculate revenue metrics")
    print(f"\n4. Data Analysis Agent Execution (Laptop C):")
    print(f"   Summary Columns: {data_out['summary']['columns']}")
    print(f"   Sandbox Result: {data_out['sandbox_execution']['output'].strip()}")
    assert data_out["sandbox_execution"]["success"] is True

    # 5. Test Code Agent Sandbox Execution (Laptop C)
    code_agent = CodeAgent()
    code_out = code_agent.generate_and_test("Write forecast function")
    print(f"\n5. Code Agent Execution (Laptop C):")
    print(f"   Sandbox Status: {code_out['status']}")
    print(f"   Sandbox Output: {code_out['output']}")
    assert code_out["status"] == "SUCCESS"

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL 40% MILESTONE DELIVERABLES ARE FULLY OPERATIONAL!")
    print("=" * 70)

if __name__ == "__main__":
    test_full_40_percent_pipeline()
