# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Building
```bash
npm run build      # Compile TypeScript to JavaScript
npm run dev        # Compile TypeScript in watch mode
```

### Running
```bash
npm start          # Start the HTTP MCP server (listens on port 3000)
npx -y @pimzino/agentic-tools-mcp  # Run directly via npx
```

## Architecture

This MCP server provides advanced task management and agent memory capabilities through a Model Context Protocol implementation over HTTP transport.

### Core Structure
- **Entry Point**: `src/index.ts` - Starts the HTTP server
- **HTTP Server**: `src/streamable-server.ts` - Express-based HTTP MCP server with StreamableHTTPServerTransport
- **Legacy STDIO Server**: `src/server.ts` - Original STDIO-based MCP server (still available for reference)
- **Storage Config**: `src/utils/storage-config.ts` - Handles --claude flag for global vs project-specific storage

### HTTP Server Details
- Uses Express.js with StreamableHTTPServerTransport
- Endpoints:
  - POST `/mcp` - Main MCP communication
  - GET `/mcp` - Server-to-client notifications (SSE)
  - DELETE `/mcp` - Session termination
- Storage configuration via headers:
  - `mcp-use-global-directory: true` - Enable global directory mode (like --claude flag)
  - Default: project-specific storage
- Per-session configuration stored in memory

### Feature: Task Management (`src/features/task-management/`)
Hierarchical task system with Projects → Tasks → Subtasks:
- **Models**: Enhanced task model with dependencies, priority (1-10), complexity (1-10), status workflow, tags, and time tracking
- **Storage**: JSON file-based persistence in `.agentic-tools-mcp/tasks/`
- **Tools**: CRUD operations plus advanced AI agent tools (PRD parsing, task recommendations, complexity analysis, progress inference, research)

### Feature: Agent Memories (`src/features/agent-memories/`)
Intelligent memory system with file-based storage:
- **Models**: Title/content architecture with metadata and categories
- **Storage**: Individual JSON files organized by category in `.agentic-tools-mcp/memories/`
- **Search**: Multi-field text search with relevance scoring (title 60%, content 30%, category 20%)

### Key Design Patterns
- All tools require `workingDirectory` parameter for project isolation
- HTTP clients can override storage mode with headers
- Command-line `--claude` flag sets default behavior only
- Atomic operations with validation and error handling
- Confirmation required for destructive operations
- Session-based configuration management