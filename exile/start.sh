#!/bin/bash

echo "🚀 Starting Exile Document Processing Application"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}Error: Please run this script from the exile/ directory${NC}"
    exit 1
fi

# Backend setup and start
echo -e "${BLUE}📦 Setting up Backend...${NC}"
cd app

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install/update dependencies
echo -e "${YELLOW}Installing/updating dependencies...${NC}"
pip install -r ../requirements.txt

# Create uploads directory
mkdir -p ../uploads

# Start backend in background
echo -e "${GREEN}🔥 Starting Backend server on http://192.168.1.2:8000${NC}"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Frontend setup and start
echo -e "${BLUE}📦 Setting up Frontend...${NC}"
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install
fi

# Start frontend
echo -e "${GREEN}🌐 Starting Frontend server on http://192.168.1.2:3000${NC}"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

# Display status
echo ""
echo -e "${GREEN}✅ Both services are starting up!${NC}"
echo ""
echo -e "${BLUE}📍 Access the application at:${NC}"
echo -e "   Frontend: ${GREEN}http://192.168.1.2:3000${NC}"
echo -e "   Backend API: ${GREEN}http://192.168.1.2:8000${NC}"
echo -e "   API Docs: ${GREEN}http://192.168.1.2:8000/docs${NC}"
echo ""
echo -e "${YELLOW}📝 Log files:${NC}"
echo "   Check terminal output for real-time logs"
echo ""
echo -e "${YELLOW}⏹️  To stop all services, press Ctrl+C${NC}"
echo ""

# Wait for user interrupt
trap 'echo -e "\n${YELLOW}🛑 Stopping services...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e "${GREEN}✅ All services stopped${NC}"; exit 0' INT

# Keep script running
wait 