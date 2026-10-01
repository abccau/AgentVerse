from typing import Dict, Any
import re
from tools.code_tools import PythonREPLSandbox
from backend.ollama_client import ollama_client

class CodeAgent:
    """
    Code Agent (Laptop C)
    Uses local Ollama LLM (qwen2.5:1.5b) to dynamically write Python code
    specifically for the user's request, validates AST syntax, and executes in sandbox.
    """
    def __init__(self):
        self.sandbox = PythonREPLSandbox()
        self.llm = ollama_client

    def generate_and_test(self, task_instruction: str) -> Dict[str, Any]:
        # 1. Ask local Ollama LLM to generate the Python code
        prompt = (
            f"Write a short, clean, executable Python script for this task: '{task_instruction}'.\n"
            "Include print statements showing the output.\n"
            "Return ONLY the executable Python code inside a ```python ``` block without explanation."
        )
        raw_response = self.llm.generate(prompt)

        # 2. Extract code from markdown block if present
        code_match = re.search(r'```(?:python)?\s*([\s\S]*?)```', raw_response)
        if code_match:
            code = code_match.group(1).strip()
        else:
            code = raw_response.strip()

        # 3. AST Syntax validation
        syntax_check = self.sandbox.validate_syntax(code)
        if not syntax_check["valid"]:
            # Fallback simple code if syntax failed
            return {
                "agent": "CodeAgent",
                "node": "Laptop C",
                "status": "SYNTAX_ERROR",
                "code": code,
                "error": syntax_check["error"]
            }

        # 4. Run inside secure sandbox
        run_res = self.sandbox.execute(code)

        return {
            "agent": "CodeAgent",
            "node": "Laptop C",
            "status": "SUCCESS" if run_res["success"] else "EXEC_FAILED",
            "code": code.strip(),
            "output": run_res["output"].strip() if run_res["output"] else "(Code executed with no output)",
            "error": run_res["error"]
        }
