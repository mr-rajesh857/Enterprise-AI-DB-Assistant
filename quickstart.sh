#!/bin/bash

# Enterprise AI DB Assistant - Quick Start Script
# This script automates the setup of both backend and frontend

set -e

echo "=========================================="
echo "Enterprise AI DB Assistant - Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker Compose is not installed${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠ Python 3 is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Start PostgreSQL
echo -e "${BLUE}Step 1: Starting PostgreSQL database...${NC}"
cd "$SCRIPT_DIR"

if docker-compose ps | grep -q "postgres"; then
    echo -e "${YELLOW}PostgreSQL already running${NC}"
else
    docker-compose up -d postgres
    echo -e "${GREEN}✓ PostgreSQL started${NC}"
    sleep 5
fi
echo ""

# Step 2: Setup Backend
echo -e "${BLUE}Step 2: Setting up backend...${NC}"
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

echo "Seeding database with test users..."
python seed.py > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Step 3: Setup Frontend
echo -e "${BLUE}Step 3: Setting up frontend...${NC}"
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install --silent > /dev/null 2>&1 || npm install
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open a terminal and start the backend:"
echo "   cd $SCRIPT_DIR/backend"
echo "   source venv/bin/activate"
echo "   python run.py"
echo ""
echo "2. Open another terminal and start the frontend:"
echo "   cd $SCRIPT_DIR/frontend"
echo "   npm run dev"
echo ""
echo "3. Open your browser and go to:"
echo "   http://localhost:3000"
echo ""
echo "📝 Test Credentials:"
echo "   Admin:    admin@example.com / Admin@123"
echo "   Analyst:  analyst@example.com / Analyst@123"
echo "   Viewer:   viewer@example.com / Viewer@123"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: $SCRIPT_DIR/SETUP_GUIDE.md"
echo "   - Frontend README: $SCRIPT_DIR/frontend/FRONTEND_README.md"
echo "   - Build Status: $SCRIPT_DIR/BUILD_STATUS.md"
echo ""
echo "✅ Backend API Docs: http://localhost:8000/docs"
echo ""
