# Docker Setup for Agentic Tools MCP Server

This guide explains how to run the Agentic Tools MCP Server using Docker.

## Important: Host Filesystem Access

Since this MCP server needs to access project directories on your host system, you must configure volume mounts and path mappings. The server cannot access host paths that aren't mounted into the container.

### Solution 1: Use docker-compose.workspace.yml (Recommended)

```bash
# Edit docker-compose.workspace.yml to add your directories
# Then run:
docker-compose -f docker-compose.workspace.yml up -d
```

### Solution 2: Mount directories manually

```bash
docker run -d \
  -p 3000:3000 \
  -v /Users/jasonschulz/Developer:/workspace/Developer:ro \
  -e PATH_MAPPING="/Users/jasonschulz/Developer:/workspace/Developer" \
  -v ./data:/app/.agentic-tools-mcp \
  --name agentic-tools-mcp \
  agentic-tools-mcp
```

When calling the MCP tools, use the original host paths - they'll be automatically translated to container paths.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the server
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down
```

### Using Docker CLI

```bash
# Build the image
docker build -t agentic-tools-mcp .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/.agentic-tools-mcp \
  -v ~/.agentic-tools-mcp:/data/.agentic-tools-mcp \
  --name agentic-tools-mcp \
  agentic-tools-mcp

# View logs
docker logs -f agentic-tools-mcp

# Stop the container
docker stop agentic-tools-mcp
docker rm agentic-tools-mcp
```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Server port (default: 3000)
- `CLAUDE_FLAG`: Set to `true` to enable global directory mode by default

### Storage Volumes

The Docker setup supports both storage modes:

1. **Project-specific storage** (default):
   - Mounted at `/app/.agentic-tools-mcp` inside the container
   - Maps to `./data` on your host

2. **Global storage** (when using --claude flag or header):
   - Mounted at `/data/.agentic-tools-mcp` inside the container
   - Maps to `~/.agentic-tools-mcp` on your host

### Health Check

The container includes a health check that monitors the `/health` endpoint:
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3
- Start period: 40 seconds

## Advanced Usage

### Custom Docker Compose Configuration

You can override settings by creating a `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  agentic-tools-mcp:
    environment:
      - CLAUDE_FLAG=true
    ports:
      - "8080:3000"
```

### Building for Production

For production deployment, you might want to:

1. Use a specific version tag:
   ```bash
   docker build -t agentic-tools-mcp:v1.7.0 .
   docker tag agentic-tools-mcp:v1.7.0 agentic-tools-mcp:latest
   ```

2. Push to a registry:
   ```bash
   docker tag agentic-tools-mcp:latest your-registry/agentic-tools-mcp:latest
   docker push your-registry/agentic-tools-mcp:latest
   ```

### Running Behind a Reverse Proxy

If running behind nginx or another reverse proxy:

```nginx
location /mcp {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Troubleshooting

### Container won't start
- Check logs: `docker logs agentic-tools-mcp`
- Ensure port 3000 is not already in use
- Verify volume permissions

### Storage issues
- Ensure the data directories exist and have proper permissions
- The container runs as non-root user (nodejs, UID 1001)
- You may need to adjust permissions: `chmod -R 755 ./data`

### Health check failing
- Verify the server is actually running: `docker exec agentic-tools-mcp ps aux`
- Check if the health endpoint responds: `curl http://localhost:3000/health`
- Review container logs for errors

## Security Considerations

- The container runs as a non-root user (nodejs)
- Only port 3000 is exposed
- Uses Alpine Linux for minimal attack surface
- Includes proper signal handling with dumb-init
- No sensitive data is included in the image