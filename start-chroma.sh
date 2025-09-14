#!/bin/bash

# Enhanced Research Workflow Setup Script
echo "🚀 Setting up Enhanced Research Workflow..."

# Check if ChromaDB is installed
if ! command -v chroma &> /dev/null; then
    echo "📦 Installing ChromaDB..."
    
    # Install ChromaDB using pip
    if command -v pip &> /dev/null; then
        pip install chromadb
    elif command -v pip3 &> /dev/null; then
        pip3 install chromadb
    else
        echo "❌ pip not found. Please install Python and pip first."
        exit 1
    fi
else
    echo "✅ ChromaDB is already installed"
fi

# Start ChromaDB server
echo "🔧 Starting ChromaDB server..."
echo "   ChromaDB will run on http://localhost:8000"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start ChromaDB in the background
chroma run --host localhost --port 8000 &

# Store the PID
CHROMA_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping ChromaDB server..."
    kill $CHROMA_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for ChromaDB to start
echo "⏳ Waiting for ChromaDB to start..."
sleep 3

# Check if ChromaDB is running
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null; then
    echo "✅ ChromaDB is running successfully!"
    echo ""
    echo "🎯 You can now run your enhanced research workflow:"
    echo "   npm run start"
    echo ""
    echo "📚 Or run the example:"
    echo "   npx tsx src/examples/enhancedResearchExample.ts"
    echo ""
    echo "Press Ctrl+C to stop ChromaDB server"
    
    # Keep the script running
    wait $CHROMA_PID
else
    echo "❌ Failed to start ChromaDB. Please check the installation."
    kill $CHROMA_PID 2>/dev/null
    exit 1
fi
