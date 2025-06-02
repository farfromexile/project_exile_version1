"""
# Exile Document Processing API

A FastAPI application for uploading and processing PDF and TXT files with text extraction and search capabilities.

## Setup and Installation

1. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Linux/Mac
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   cd app
   uvicorn main:app --reload
   ```

## API Endpoints

1. Upload Document
   - POST /upload/
   - Accepts multipart/form-data with 'file' key
   - Supports PDF and TXT files

2. Search Documents
   - GET /query/
   - Query parameters:
     - category: person, book, or formula
     - keyword: search term

## Testing

1. Upload a file:
   ```bash
   curl -X POST -F "file=@/path/to/your/file.pdf" http://localhost:8000/upload/
   ```

2. Search documents:
   ```bash
   curl "http://localhost:8000/query?category=book&keyword=example"
   ```

Visit http://localhost:8000/docs for interactive API documentation.
"""

from fastapi import FastAPI, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum
from datetime import datetime
from typing import Dict, List, Optional
import os
import fitz
import uuid
import re
import logging

# Logging konfigürasyonu
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Exile API",
    description="Document Processing API with text extraction and search capabilities"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.1.2:3000", "http://192.168.1.2:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
UPLOAD_DIR = "../uploads"
ALLOWED_EXTENSIONS = ('.pdf', '.txt')

# In-memory database for storing document data
documents_db: Dict[str, Dict] = {}

# Categories for document search
class Category(str, Enum):
    person = "person"
    book = "book"
    formula = "formula"

@app.on_event("startup")
async def startup_event():
    """Create uploads directory on startup if it doesn't exist."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    """Root endpoint to confirm API is running."""
    return {"message": "Exile is running"}

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from a PDF file using PyMuPDF."""
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

def process_text_content(content: str) -> dict:
    """Metni yapılandırılmış bir formata dönüştürür.
    Format:
    [TABLO:Başlık]
    İçerik satırları
    [/TABLO]
    """
    sections = {}
    
    # TABLO bloklarını bul
    pattern = r'\[TABLO:([^\]]+)\](.*?)\[/TABLO\]'
    matches = re.findall(pattern, content, re.DOTALL)
    
    for title, content_block in matches:
        title = title.strip()
        lines = []
        
        # İçeriği satırlara böl ve temizle
        for line in content_block.strip().split('\n'):
            line = line.strip()
            if line:  # Boş olmayan satırları ekle
                lines.append(line)
        
        if lines:  # Sadece içeriği olan bölümleri ekle
            sections[title] = lines
    
    return sections

def format_search_result(content: str, keyword: str) -> list:
    """Arama sonuçlarını formatlı bir şekilde döndürür."""
    sections = process_text_content(content)
    matches = []
    keyword_lower = keyword.lower()
    
    for section_name, lines in sections.items():
        matching_lines = []
        section_matches = False
        
        # Bölüm başlığında arama
        if keyword_lower in section_name.lower():
            section_matches = True
            matching_lines = lines  # Tüm içeriği göster
        else:
            # İçerikte arama
            for line in lines:
                if keyword_lower in line.lower():
                    matching_lines.append(line)
                    section_matches = True
        
        if section_matches:
            matches.append({
                'section': section_name,
                'matches': matching_lines,
                'total_lines': len(lines),
                'matching_lines': len(matching_lines)
            })
    
    return sorted(matches, key=lambda x: x['matching_lines'], reverse=True)

@app.post("/upload/")
async def upload_file(file: UploadFile):
    """
    Upload and process PDF or TXT files.
    Extracts text content and stores in the in-memory database.
    """
    logger.info(f"Dosya yükleme isteği alındı: {file.filename}")
    
    if not file or not file.filename:
        logger.error("Dosya sağlanmadı")
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.endswith(ALLOWED_EXTENSIONS):
        logger.error(f"Desteklenmeyen dosya türü: {file.filename}")
        raise HTTPException(
            status_code=400,
            detail=f"Only {', '.join(ALLOWED_EXTENSIONS)} files are allowed"
        )
    
    # Generate unique filename to prevent overwrites
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        # Save uploaded file
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"Dosya kaydedildi: {file_path}")
        
        # Extract text based on file type
        if file_extension.lower() == '.pdf':
            text_content = extract_text_from_pdf(file_path)
            logger.info("PDF içeriği başarıyla çıkarıldı")
        else:
            text_content = read_text_file(file_path)
            logger.info("TXT içeriği başarıyla okundu")
        
        # Store in database with metadata
        doc_id = str(uuid.uuid4())
        documents_db[doc_id] = {
            'content': text_content,
            'filename': file.filename,
            'filetype': file_extension[1:],
            'upload_datetime': datetime.now().isoformat(),
            'stored_filename': unique_filename
        }
        
        logger.info(f"Dosya başarıyla işlendi ve veritabanına kaydedildi: {doc_id}")
        
        return JSONResponse(
            content={
                "message": "File uploaded and processed successfully",
                "filename": file.filename,
                "doc_id": doc_id
            },
            status_code=200
        )
        
    except Exception as e:
        logger.error(f"Dosya yükleme hatası: {str(e)}")
        # Clean up file if upload fails
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Hata sonrası dosya temizlendi: {file_path}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/query/")
async def query_documents(
    category: Category,
    keyword: str = Query(..., min_length=1, description="Search keyword")
):
    """
    Search uploaded documents based on category and keyword.
    Returns matching text snippets with context.
    """
    logger.info(f"Arama isteği alındı - Kategori: {category}, Anahtar Kelime: {keyword}")
    
    try:
        results = []
        keyword_lower = keyword.lower()
        
        for doc_id, doc_data in documents_db.items():
            filename = doc_data['filename']
            content = doc_data['content']
            
            # Dosya adında arama yap
            filename_match = keyword_lower in filename.lower()
            
            if filename_match:
                logger.info(f"Dosya adı eşleşmesi bulundu: {filename}")
                # Dosya adında eşleşme varsa tüm bölümleri göster
                sections = process_text_content(content)
                matches = []
                
                for section_name, lines in sections.items():
                    matches.append({
                        'section': section_name,
                        'matches': lines,
                        'total_lines': len(lines),
                        'matching_lines': len(lines),
                        'match_type': 'filename'
                    })
                
                if matches:
                    results.append({
                        'filename': filename,
                        'upload_datetime': doc_data['upload_datetime'],
                        'filetype': doc_data['filetype'],
                        'doc_id': doc_id,
                        'matches': matches,
                        'total_matches': sum(m['matching_lines'] for m in matches),
                        'match_type': 'filename'
                    })
            else:
                # İçerik bazlı arama
                matches = format_search_result(content, keyword)
                
                if matches:
                    logger.info(f"İçerik eşleşmesi bulundu: {filename}")
                    # Match type'ı ekle
                    for match in matches:
                        match['match_type'] = 'content'
                    
                    results.append({
                        'filename': filename,
                        'upload_datetime': doc_data['upload_datetime'],
                        'filetype': doc_data['filetype'],
                        'doc_id': doc_id,
                        'matches': matches,
                        'total_matches': sum(m['matching_lines'] for m in matches),
                        'match_type': 'content'
                    })
        
        # Önce dosya adı eşleşmeleri, sonra içerik eşleşmeleri
        results.sort(key=lambda x: (x['match_type'] != 'filename', -x['total_matches']))
        
        logger.info(f"Arama tamamlandı - {len(results)} sonuç bulundu")
        
        return {
            "category": category,
            "keyword": keyword,
            "total_matches": len(results),
            "matches": results
        }
        
    except Exception as e:
        logger.error(f"Arama hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 