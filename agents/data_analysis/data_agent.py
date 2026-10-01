import pandas as pd
from typing import Dict, Any
from tools.data_tools import DataLoaderTool
from tools.code_tools import PythonREPLSandbox

class DataAnalysisAgent:
    """
    Data Analysis Agent (Laptop C)
    Parses data requirements, executes Pandas calculations, and generates statistics.
    """
    def __init__(self):
        self.sandbox = PythonREPLSandbox()

    def analyze_dataset(self, df_or_path: Any, prompt: str) -> Dict[str, Any]:
        if isinstance(df_or_path, str):
            df = DataLoaderTool.load_dataset(df_or_path)
        elif isinstance(df_or_path, pd.DataFrame):
            df = df_or_path
        else:
            # Default demo sample dataset
            df = pd.DataFrame({
                "Quarter": ["Q1", "Q2", "Q3", "Q4"],
                "Revenue": [120000, 145000, 160000, 195000],
                "Expenses": [90000, 95000, 105000, 110000]
            })

        summary = DataLoaderTool.get_dataset_summary(df)

        # Generate sample analysis script
        script = f"""
total_rev = df['Revenue'].sum()
avg_rev = df['Revenue'].mean()
print(f'Total Revenue: {{total_rev}}')
print(f'Average Revenue: {{avg_rev}}')
"""
        exec_res = self.sandbox.execute(script, context={"df": df})

        return {
            "agent": "DataAnalysisAgent",
            "node": "Laptop C",
            "status": "COMPLETED",
            "summary": summary,
            "sandbox_execution": exec_res
        }
