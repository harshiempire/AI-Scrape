#!/bin/bash

# Docker ChromaDB Management Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to start ChromaDB
start_chromadb() {
    print_status "Starting ChromaDB in Docker container..."
    
    # Use docker compose if available, otherwise docker-compose
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD up -d chromadb
    
    print_status "Waiting for ChromaDB to be ready..."
    
    # Wait for ChromaDB to be healthy
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8000/api/v2/heartbeat > /dev/null 2>&1; then
            print_success "ChromaDB is ready and running!"
            print_status "ChromaDB is accessible at: http://localhost:8000"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Waiting for ChromaDB..."
        sleep 2
        ((attempt++))
    done
    
    print_error "ChromaDB failed to start within the expected time"
    print_status "Check logs with: $COMPOSE_CMD logs chromadb"
    exit 1
}

# Function to stop ChromaDB
stop_chromadb() {
    print_status "Stopping ChromaDB..."
    
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD down
    
    print_success "ChromaDB stopped"
}

# Function to show ChromaDB status
show_status() {
    print_status "ChromaDB Status:"
    
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD ps chromadb
    
    echo ""
    print_status "Health Check:"
    if curl -s http://localhost:8000/api/v2/heartbeat > /dev/null 2>&1; then
        print_success "ChromaDB is healthy and responding"
    else
        print_warning "ChromaDB is not responding"
    fi
}

# Function to show logs
show_logs() {
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD logs -f chromadb
}

# Function to rebuild ChromaDB
rebuild_chromadb() {
    print_status "Rebuilding ChromaDB container..."
    
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD down
    $COMPOSE_CMD build --no-cache chromadb
    $COMPOSE_CMD up -d chromadb
    
    print_success "ChromaDB rebuilt and started"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up ChromaDB resources..."
    
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD down -v
    docker system prune -f
    
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "ChromaDB Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start ChromaDB container"
    echo "  stop      Stop ChromaDB container"
    echo "  restart   Restart ChromaDB container"
    echo "  status    Show ChromaDB status"
    echo "  logs      Show ChromaDB logs"
    echo "  rebuild   Rebuild ChromaDB container"
    echo "  cleanup   Clean up ChromaDB resources"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start ChromaDB"
    echo "  $0 status   # Check status"
    echo "  $0 logs     # View logs"
}

# Main script logic
case "${1:-start}" in
    start)
        check_docker
        check_docker_compose
        start_chromadb
        ;;
    stop)
        check_docker
        stop_chromadb
        ;;
    restart)
        check_docker
        check_docker_compose
        stop_chromadb
        sleep 2
        start_chromadb
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    rebuild)
        check_docker
        check_docker_compose
        rebuild_chromadb
        ;;
    cleanup)
        check_docker
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
