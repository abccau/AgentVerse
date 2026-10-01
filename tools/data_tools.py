import pandas as pd
import json
import os
from typing import Dict, Any, Union

class DataLoaderTool:
    """Tool for loading tabular datasets and computing statistical summaries."""
    
    @staticmethod
    def load_dataset(file_path: str) -> pd.DataFrame:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dataset not found at {file_path}")
        
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".csv":
            return pd.read_csv(file_path)
        elif ext in [".xls", ".xlsx"]:
            return pd.read_excel(file_path)
        elif ext == ".json":
            return pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported format: {ext}")

    @classmethod
    def get_dataset_summary(cls, df: pd.DataFrame) -> Dict[str, Any]:
        return {
            "total_rows": int(len(df)),
            "total_columns": int(len(df.columns)),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "null_counts": {col: int(count) for col, count in df.isnull().sum().items()},
            "numeric_summary": df.describe().to_dict() if not df.select_dtypes(include="number").empty else {}
        }
