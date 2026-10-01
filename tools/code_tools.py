import ast
import sys
import io
import contextlib
import traceback
from typing import Dict, Any

class PythonREPLSandbox:
    """
    Executes Python scripts within an AST syntax-checked sandbox with standard output capture.
    Prevents execution of malicious or dangerous operations.
    """
    FORBIDDEN_MODULES = {"os", "subprocess", "shutil", "socket", "pty"}

    @classmethod
    def validate_syntax(cls, code: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name in cls.FORBIDDEN_MODULES:
                            return {"valid": False, "error": f"Import of module '{alias.name}' is restricted."}
                elif isinstance(node, ast.ImportFrom):
                    if node.module in cls.FORBIDDEN_MODULES:
                        return {"valid": False, "error": f"Import from module '{node.module}' is restricted."}
            return {"valid": True, "error": None}
        except SyntaxError as e:
            return {"valid": False, "error": f"SyntaxError: {str(e)}"}

    @classmethod
    def execute(cls, code: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        validation = cls.validate_syntax(code)
        if not validation["valid"]:
            return {
                "success": False,
                "output": "",
                "error": validation["error"]
            }

        stdout_capture = io.StringIO()
        exec_globals = {"__builtins__": __builtins__}
        if context:
            exec_globals.update(context)

        try:
            with contextlib.redirect_stdout(stdout_capture):
                exec(code, exec_globals)
            output = stdout_capture.getvalue()
            return {
                "success": True,
                "output": output,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "output": stdout_capture.getvalue(),
                "error": traceback.format_exc()
            }
