#!/bin/bash

# Test script for Docker ChromaDB setup
echo "🧪 Testing Docker ChromaDB Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    echo "   On macOS: Open Docker Desktop"
    echo "   On Linux: sudo systemctl start docker"
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose is available
if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
    echo "❌ Docker Compose is not available"
    exit 1
fi

echo "✅ Docker Compose is available"

# Build the ChromaDB image
echo "🔨 Building ChromaDB Docker image..."
if docker compose build chromadb; then
    echo "✅ ChromaDB image built successfully"
else
    echo "❌ Failed to build ChromaDB image"
    exit 1
fi

# Start ChromaDB
echo "🚀 Starting ChromaDB container..."
if docker compose up -d chromadb; then
    echo "✅ ChromaDB container started"
else
    echo "❌ Failed to start ChromaDB container"
    exit 1
fi

# Wait for ChromaDB to be ready
echo "⏳ Waiting for ChromaDB to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8000/api/v2/heartbeat > /dev/null 2>&1; then
        echo "✅ ChromaDB is ready and responding!"
        break
    fi
    
    echo "   Attempt $attempt/$max_attempts - Waiting..."
    sleep 2
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ ChromaDB failed to start within expected time"
    echo "📋 Container logs:"
    docker compose logs chromadb
    exit 1
fi

# Test the API
echo "🔍 Testing ChromaDB API..."
if curl -s http://localhost:8000/api/v2/heartbeat | grep -q "nanosecond heartbeat"; then
    echo "✅ ChromaDB API is working correctly"
else
    echo "⚠️  ChromaDB API responded but may not be fully ready"
fi

# Show container status
echo "📊 Container Status:"
docker compose ps chromadb

echo ""
echo "🎉 Docker ChromaDB setup is complete!"
echo "📍 ChromaDB is accessible at: http://localhost:8000"
echo ""
echo "📋 Available commands:"
echo "   npm run chroma:status  # Check status"
echo "   npm run chroma:logs    # View logs"
echo "   npm run chroma:stop    # Stop ChromaDB"
echo ""
echo "🧪 You can now run your enhanced research workflow!"
