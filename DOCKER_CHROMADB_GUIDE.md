# Docker ChromaDB Setup Guide

This guide shows how to run ChromaDB in a Docker container for the Enhanced Research Workflow.

## 🐳 Docker Setup

### Prerequisites
- Docker installed and running
- Docker Compose (included with Docker Desktop)

### Quick Start

1. **Start ChromaDB**:
   ```bash
   npm run chroma:start
   ```

2. **Check Status**:
   ```bash
   npm run chroma:status
   ```

3. **View Logs**:
   ```bash
   npm run chroma:logs
   ```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run chroma:start` | Start ChromaDB container |
| `npm run chroma:stop` | Stop ChromaDB container |
| `npm run chroma:restart` | Restart ChromaDB container |
| `npm run chroma:status` | Show ChromaDB status |
| `npm run chroma:logs` | Show ChromaDB logs |
| `npm run chroma:rebuild` | Rebuild ChromaDB container |
| `npm run chroma:cleanup` | Clean up ChromaDB resources |

### Manual Docker Commands

You can also use the Docker management script directly:

```bash
# Start ChromaDB
./docker-chroma.sh start

# Stop ChromaDB
./docker-chroma.sh stop

# Check status
./docker-chroma.sh status

# View logs
./docker-chroma.sh logs

# Rebuild container
./docker-chroma.sh rebuild

# Clean up everything
./docker-chroma.sh cleanup
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# SerpAPI Configuration
SERPAPI_API_KEY=your_serpapi_key_here

# ChromaDB Configuration (default: http://localhost:8000)
CHROMA_URL=http://localhost:8000
```

### Docker Compose Configuration

The `docker-compose.yml` file includes:

- **ChromaDB Service**: Runs on port 8000
- **Persistent Storage**: Data is stored in a Docker volume
- **Health Checks**: Automatic health monitoring
- **Auto-restart**: Container restarts unless manually stopped

### Custom Configuration

You can modify the Docker setup by editing:

1. **Dockerfile.chroma**: ChromaDB container configuration
2. **docker-compose.yml**: Service configuration and networking
3. **docker-chroma.sh**: Management script

## 📊 Monitoring

### Health Check
ChromaDB includes a health check endpoint:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

### Container Status
```bash
docker ps
```

### Resource Usage
```bash
docker stats ai-scrape-chromadb
```

## 🚀 Production Deployment

### Docker Compose for Production

For production, you might want to:

1. **Use a reverse proxy** (nginx/traefik)
2. **Add SSL/TLS termination**
3. **Configure backup strategies**
4. **Set resource limits**

Example production docker-compose.yml:
```yaml
version: '3.8'

services:
  chromadb:
    build:
      context: .
      dockerfile: Dockerfile.chroma
    container_name: ai-scrape-chromadb
    ports:
      - "8000:8000"
    volumes:
      - chromadb_data:/app/chroma_data
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=8000
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  chromadb_data:
    driver: local
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Check what's using port 8000
   lsof -i :8000
   
   # Stop the conflicting service or change port in docker-compose.yml
   ```

2. **Container Won't Start**:
   ```bash
   # Check logs
   npm run chroma:logs
   
   # Rebuild container
   npm run chroma:rebuild
   ```

3. **Permission Issues**:
   ```bash
   # Make sure script is executable
   chmod +x docker-chroma.sh
   ```

4. **Docker Not Running**:
   ```bash
   # Start Docker Desktop or Docker daemon
   # On macOS: open Docker Desktop
   # On Linux: sudo systemctl start docker
   ```

### Debugging

1. **Check Container Status**:
   ```bash
   docker ps -a
   ```

2. **Inspect Container**:
   ```bash
   docker inspect ai-scrape-chromadb
   ```

3. **Access Container Shell**:
   ```bash
   docker exec -it ai-scrape-chromadb /bin/bash
   ```

4. **Check Resource Usage**:
   ```bash
   docker stats ai-scrape-chromadb
   ```

## 🔄 Data Persistence

### Backup Data
```bash
# Create backup
docker run --rm -v ai-scrape-chromadb_chromadb_data:/data -v $(pwd):/backup alpine tar czf /backup/chromadb-backup.tar.gz -C /data .
```

### Restore Data
```bash
# Restore backup
docker run --rm -v ai-scrape-chromadb_chromadb_data:/data -v $(pwd):/backup alpine tar xzf /backup/chromadb-backup.tar.gz -C /data
```

## 🌐 Network Configuration

### External Access
To access ChromaDB from other machines:

1. **Change host binding** in docker-compose.yml:
   ```yaml
   ports:
     - "0.0.0.0:8000:8000"
   ```

2. **Update CHROMA_URL** in your .env:
   ```bash
   CHROMA_URL=http://your-server-ip:8000
   ```

### Docker Network
For multi-container setups, you can create a custom network:

```yaml
networks:
  research-network:
    driver: bridge

services:
  chromadb:
    networks:
      - research-network
```

## 📈 Performance Tuning

### Memory Configuration
```yaml
services:
  chromadb:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

### Volume Optimization
```yaml
volumes:
  chromadb_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/fast/storage
```

## 🔒 Security Considerations

1. **Network Security**: Use reverse proxy for external access
2. **Authentication**: Consider adding authentication layer
3. **Data Encryption**: Encrypt sensitive data at rest
4. **Access Control**: Limit container access to necessary ports only

## 📚 Additional Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
