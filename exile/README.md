# Exile Document Processing Application

A powerful document processing application built with FastAPI backend and React frontend for uploading, processing, and searching PDF and TXT files.

## Features

- **File Upload**: Support for PDF and TXT files
- **Text Extraction**: Automatic text extraction from uploaded documents
- **Smart Search**: Category-based search with keyword matching
- **Modern UI**: Responsive React interface with Tailwind CSS
- **Real-time Processing**: Async operations for better performance

## Quick Start

### Using the Startup Script (Recommended)

```bash
cd exile/
./start.sh
```

This script will:
- Set up the virtual environment for the backend
- Install all dependencies
- Start both backend and frontend services
- Display access URLs

### Manual Setup

#### Backend Setup

```bash
cd exile/app/

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd exile/frontend/

# Install dependencies
npm install

# Start the development server
npm run dev -- --host 0.0.0.0
```

## Access Points

- **Frontend Application**: http://192.168.1.2:3000
- **Backend API**: http://192.168.1.2:8000
- **API Documentation**: http://192.168.1.2:8000/docs

## API Endpoints

### Upload Document
- **POST** `/upload/`
- Accepts multipart/form-data with 'file' key
- Supports PDF and TXT files

### Search Documents
- **GET** `/query/`
- Query parameters:
  - `category`: person, book, or formula
  - `keyword`: search term

## Document Format

For best search results, format your text documents using the table format:

```
[TABLO:Section Title]
Content line 1
Content line 2
Content line 3
[/TABLO]

[TABLO:Another Section]
More content here
[/TABLO]
```

## Network Configuration

The application is configured to run on IP address `192.168.1.2`. Make sure:

1. Your system is accessible on this IP
2. Ports 3000 and 8000 are available
3. Firewall allows connections to these ports

## Dependencies

### Backend
- FastAPI 0.115.9
- uvicorn 0.27.1
- python-multipart 0.0.9
- PyMuPDF 1.24.0

### Frontend
- React 18.2.0
- Vite 5.1.4
- Tailwind CSS 3.4.1
- Axios 1.6.7
- Heroicons 2.1.1

## Troubleshooting

### Common Issues

1. **Port already in use**: Stop any existing services on ports 3000 or 8000
2. **Permission denied**: Ensure the startup script is executable (`chmod +x start.sh`)
3. **Network issues**: Verify your IP address matches the configuration (192.168.1.2)
4. **Dependencies missing**: Run `npm install` in frontend/ and `pip install -r requirements.txt` in app/

### Logs

- Backend logs appear in the terminal where uvicorn is running
- Frontend logs appear in the terminal where npm dev server is running
- Check browser console for frontend errors

## Project Structure

```
exile/
├── app/                    # Backend FastAPI application
│   ├── main.py            # Main application file
│   ├── utils.py           # Utility functions
│   └── venv/              # Python virtual environment
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── uploads/               # File upload directory
├── requirements.txt       # Backend dependencies
├── start.sh              # Startup script
└── README.md             # This file
``` 