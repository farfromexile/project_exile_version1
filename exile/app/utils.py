import fitz
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# In-memory database to store document data
documents_db: Dict[str, Dict] = {}

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from a PDF file."""
    try:
        with fitz.open(file_path) as doc:
            text = ""
            for page in doc:
                text += page.get_text()
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def read_text_file(file_path: str) -> str:
    """Read content from a text file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        raise Exception(f"Error reading text file: {str(e)}")

def store_document(
    doc_id: str,
    content: str,
    filename: str,
    filetype: str
) -> None:
    """Store document data in the in-memory database."""
    documents_db[doc_id] = {
        'content': content,
        'filename': filename,
        'filetype': filetype,
        'upload_datetime': datetime.now().isoformat(),
    }

def search_documents(
    category: str,
    keyword: str
) -> List[Dict]:
    """Search documents based on category and keyword."""
    results = []
    
    # Simple keyword matching for demonstration
    for doc_id, doc_data in documents_db.items():
        content = doc_data['content'].lower()
        keyword_lower = keyword.lower()
        
        if keyword_lower in content:
            # Find the context around the keyword
            start_idx = max(0, content.find(keyword_lower) - 100)
            end_idx = min(len(content), content.find(keyword_lower) + len(keyword_lower) + 100)
            context = content[start_idx:end_idx]
            
            results.append({
                'filename': doc_data['filename'],
                'upload_datetime': doc_data['upload_datetime'],
                'context': f"...{context}...",
                'filetype': doc_data['filetype']
            })
    
    return results 