import os
from typing import List, Dict, Any

class DocumentChunker:
    """Chunks text documents with configurable chunk size and overlap."""
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        if not text:
            return []
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            chunks.append(text[start:end])
            start += (self.chunk_size - self.chunk_overlap)
            if start >= text_len or end == text_len:
                break
        return chunks

class DocumentLoader:
    """Loads plain text, markdown, and pdf content."""
    @staticmethod
    def load_file(file_path: str) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()
        
        if ext in [".txt", ".md", ".json", ".csv"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return {"file_path": file_path, "type": ext, "content": content}
        elif ext == ".pdf":
            # Basic fallback PDF reading
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                pages = [page.extract_text() for page in reader.pages]
                return {"file_path": file_path, "type": "pdf", "content": "\n".join(pages)}
            except Exception:
                return {"file_path": file_path, "type": "pdf", "content": f"[PDF Document {os.path.basename(file_path)}]"}
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return {"file_path": file_path, "type": "unknown", "content": f.read()}
