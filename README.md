# Agentic Tools MCP Server

[![npm version](https://badge.fury.io/js/@pimzino%2Fagentic-tools-mcp.svg)](https://badge.fury.io/js/@pimzino%2Fagentic-tools-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@pimzino/agentic-tools-mcp.svg)](https://www.npmjs.com/package/@pimzino/agentic-tools-mcp)
[![GitHub stars](https://img.shields.io/github/stars/Pimzino/agentic-tools-mcp.svg)](https://github.com/Pimzino/agentic-tools-mcp/stargazers)
[![GitHub license](https://img.shields.io/github/license/Pimzino/agentic-tools-mcp.svg)](https://github.com/Pimzino/agentic-tools-mcp/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@pimzino/agentic-tools-mcp.svg)](https://nodejs.org/)

A comprehensive Model Context Protocol (MCP) server providing AI assistants with powerful **advanced task management** and **agent memories** capabilities with **project-specific storage**.

## 🔗 Ecosystem

This MCP server is part of a complete task and memory management ecosystem:

- **🖥️ [VS Code Extension](https://github.com/Pimzino/agentic-tools-mcp-companion)** - Beautiful GUI interface for managing tasks and memories directly in VS Code
- **⚡ MCP Server** (this repository) - Advanced AI agent tools and API for intelligent task management

> **💡 Pro Tip**: Use both together for the ultimate productivity experience! The VS Code extension provides a visual interface while the MCP server enables AI assistant integration with advanced features like PRD parsing, task recommendations, and research capabilities.

## Features

### 🎯 Advanced Task Management System
- **Projects**: Organize work into distinct projects with descriptions
- **Enhanced Tasks**: Rich task metadata with dependencies, priority, complexity, status, tags, and time tracking
- **Simple Subtasks**: Focused implementation tracking with name, details, and completion
- **Hierarchical Organization**: Projects → Tasks → Subtasks
- **Intelligent Dependencies**: Task dependency management with validation
- **Priority & Complexity**: 1-10 scale prioritization and complexity estimation
- **Enhanced Status Tracking**: pending, in-progress, blocked, done status workflow
- **Tag-Based Organization**: Flexible categorization and filtering
- **Time Tracking**: Estimated and actual hours for project planning
- **Progress Tracking**: Monitor completion status at all levels
- **Project-Specific Storage**: Each working directory has isolated task data
- **Git-Trackable**: Task data can be committed alongside your code

### 🧠 Agent Memories System
- **Persistent Memory**: Store and retrieve agent memories with titles and detailed content
- **Intelligent Search**: Multi-field text search with relevance scoring across titles, content, and categories
- **Smart Ranking**: Advanced scoring algorithm prioritizes title matches (60%), content matches (30%), and category bonuses (20%)
- **Rich Metadata**: Flexible metadata system for enhanced context
- **JSON Storage**: Individual JSON files organized by category, named after memory titles
- **Project-Specific**: Isolated memory storage per working directory

### 📝 Prompt Templates System
- **Reusable Prompts**: Create and manage prompt templates with structured arguments
- **System Prompts**: 8 pre-built prompts for common workflows (project kickoff, daily standup, sprint planning, etc.)
- **Flexible Arguments**: Define required/optional arguments with defaults and descriptions
- **Template Engine**: Support for variable substitution in templates using {{variable}} syntax
- **Message Sequences**: Define predefined conversation flows with user/assistant/system messages
- **Categorization**: Organize prompts by category and tags for easy discovery
- **Smart Search**: Find prompts across names, descriptions, categories, and tags
- **Execution Engine**: Execute prompts with argument validation and template processing

### 🔧 MCP Tools Available

#### Project Management
- `list_projects` - View all projects in a working directory
- `create_project` - Create a new project in a working directory
- `get_project` - Get detailed project information
- `update_project` - Edit project name/description
- `delete_project` - Delete project and all associated data

#### Task Management
- `list_tasks` - View tasks (optionally filtered by project)
- `create_task` - Create a new task with enhanced metadata (dependencies, priority, complexity, status, tags, time tracking)
- `get_task` - Get detailed task information
- `update_task` - Edit task details, metadata, or mark as completed
- `delete_task` - Delete task and all associated subtasks

#### Advanced Task Management (AI Agent Tools)
- `parse_prd` - Parse Product Requirements Documents and automatically generate structured tasks
- `get_next_task_recommendation` - Get intelligent task recommendations based on dependencies, priorities, and complexity
- `analyze_task_complexity` - Analyze task complexity and suggest breaking down overly complex tasks
- `infer_task_progress` - Analyze codebase to infer task completion status from implementation evidence
- `research_task` - Guide AI agents to perform comprehensive web research with memory integration
- `generate_research_queries` - Generate intelligent, targeted web search queries for task research

#### Subtask Management
- `list_subtasks` - View subtasks (filtered by task or project)
- `create_subtask` - Create a new subtask within a task
- `get_subtask` - Get detailed subtask information
- `update_subtask` - Edit subtask details or mark as completed
- `delete_subtask` - Delete a specific subtask

#### Agent Memory Management
- `create_memory` - Store new memories with title and detailed content
- `search_memories` - Find memories using intelligent multi-field search with relevance scoring
- `get_memory` - Get detailed memory information
- `list_memories` - List memories with optional filtering
- `update_memory` - Edit memory title, content, metadata, or categorization
- `delete_memory` - Delete a memory (requires confirmation)

#### Prompt Management
- `create_prompt` - Create reusable prompt templates with structured arguments
- `list_prompts` - Browse available prompts organized by category
- `get_prompt` - View detailed prompt information including arguments and messages
- `update_prompt` - Modify existing prompt templates
- `delete_prompt` - Remove prompt templates (requires confirmation)
- `search_prompts` - Find prompts by searching names, descriptions, categories, and tags
- `execute_prompt` - Execute a saved prompt template with provided arguments
- `initialize_system_prompts` - Load 8 pre-built prompts for common workflows

**Important**: All tools require a `workingDirectory` parameter to specify where the data should be stored. This enables project-specific task and memory management.

## Installation

### Quick Start
```bash
npx -y @pimzino/agentic-tools-mcp
```

### Global Installation
```bash
npm install -g @pimzino/agentic-tools-mcp
```

## Usage

### Storage Modes

The MCP server supports two storage modes:

#### 📁 Project-Specific Mode (Default)
Data is stored in `.agentic-tools-mcp/` subdirectories within each project's working directory.

```bash
npx -y @pimzino/agentic-tools-mcp
```

#### 🌐 Global Directory Mode
Use the `--claude` flag to store all data in a standardized global directory:
- **Windows**: `C:\Users\{username}\.agentic-tools-mcp\`
- **macOS/Linux**: `~/.agentic-tools-mcp/`

```bash
npx -y @pimzino/agentic-tools-mcp --claude
```

**When to use `--claude` flag:**
- With Claude Desktop client (non-project-specific usage)
- When you want a single global workspace for all tasks and memories
- For AI assistants that work across multiple projects

**Note**: When using `--claude` flag, the `workingDirectory` parameter in all tools is ignored and the global directory is used instead.

### With Claude Desktop

#### Project-Specific Mode (Default)
```json
{
  "mcpServers": {
    "agentic-tools": {
      "command": "npx",
      "args": ["-y", "@pimzino/agentic-tools-mcp"]
    }
  }
}
```

#### Global Directory Mode (Recommended for Claude Desktop)
```json
{
  "mcpServers": {
    "agentic-tools": {
      "command": "npx",
      "args": ["-y", "@pimzino/agentic-tools-mcp", "--claude"]
    }
  }
}
```

**Note**: The server now includes both task management and agent memories features.

### With AugmentCode

#### Project-Specific Mode (Default)
1. Open Augment Settings Panel (gear icon)
2. Add MCP server:
   - **Name**: `agentic-tools`
   - **Command**: `npx -y @pimzino/agentic-tools-mcp`
3. Restart VS Code

#### Global Directory Mode
1. Open Augment Settings Panel (gear icon)
2. Add MCP server:
   - **Name**: `agentic-tools`
   - **Command**: `npx -y @pimzino/agentic-tools-mcp --claude`
3. Restart VS Code

**Features Available**: Task management, agent memories, and text-based search capabilities.

### With VS Code Extension (Recommended)
For the best user experience, install the [**Agentic Tools MCP Companion**](https://github.com/Pimzino/agentic-tools-mcp-companion) VS Code extension:

1. Clone the companion extension repository
2. Open it in VS Code and press `F5` to run in development mode
3. Enjoy a beautiful GUI interface for all task and memory management

**Benefits of using both together:**
- 🎯 **Visual Task Management**: Rich forms with priority, complexity, status, tags, and time tracking
- 🎨 **Enhanced UI**: Status emojis, priority badges, and visual indicators
- 🔄 **Real-time Sync**: Changes in VS Code instantly available to AI assistants
- 📁 **Project Integration**: Seamlessly integrated with your workspace
- 🤖 **AI Collaboration**: Human planning with AI execution for optimal productivity

### With Other MCP Clients
The server uses STDIO transport and can be integrated with any MCP-compatible client:

#### Project-Specific Mode
```bash
npx -y @pimzino/agentic-tools-mcp
```

#### Global Directory Mode
```bash
npx -y @pimzino/agentic-tools-mcp --claude
```

### HTTP Server Mode (Advanced)
The server also includes an HTTP transport mode with backwards compatibility for SSE-limited clients:

```bash
# Clone and run the HTTP server
git clone https://github.com/Pimzino/agentic-tools-mcp.git
cd agentic-tools-mcp
npm install
npm start
```

The HTTP server listens on port 3000 by default and supports:

#### Modern Clients (StreamableHTTPServerTransport)
- **POST /mcp** - Client-to-server messages
- **GET /mcp** - Server-to-client notifications (SSE)
- **DELETE /mcp** - Session termination
- Session management with resumability

#### Legacy SSE Clients (SSEServerTransport)
- **GET /sse** - Establish SSE connection
- **POST /messages** - Send messages to server
- Backwards compatibility for older MCP implementations

#### Configuration via Headers
- `mcp-use-global-directory: true` - Enable global directory mode (like --claude flag)
- `mcp-session-id: <session-id>` - Session identifier for request routing

## Data Models

### Project
```typescript
{
  id: string;           // Unique identifier
  name: string;         // Project name
  description: string;  // Project overview
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}
```

### Task (Enhanced v1.7.0)
```typescript
{
  id: string;                    // Unique identifier
  name: string;                  // Task name
  details: string;               // Enhanced description
  projectId: string;             // Parent project reference
  completed: boolean;            // Completion status
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp

  // Enhanced metadata fields (v1.7.0)
  dependsOn?: string[];          // Task dependencies (IDs of prerequisite tasks)
  priority?: number;             // Priority level (1-10, where 10 is highest)
  complexity?: number;           // Complexity estimate (1-10, where 10 is most complex)
  status?: string;               // Enhanced status: 'pending' | 'in-progress' | 'blocked' | 'done'
  tags?: string[];               // Tags for categorization and filtering
  estimatedHours?: number;       // Estimated time to complete (hours)
  actualHours?: number;          // Actual time spent (hours)
}
```

### Subtask
```typescript
{
  id: string;           // Unique identifier
  name: string;         // Subtask name
  details: string;      // Enhanced description
  taskId: string;       // Parent task reference
  projectId: string;    // Parent project reference
  completed: boolean;   // Completion status
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}
```

### Memory
```typescript
{
  id: string;                    // Unique identifier
  title: string;                 // Short title for file naming (max 50 characters)
  content: string;               // Detailed memory content/text (no limit)
  metadata: Record<string, any>; // Flexible metadata object
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
  category?: string;            // Optional categorization
}
```

### Prompt
```typescript
{
  id: string;                    // Unique identifier
  name: string;                  // Prompt name (e.g., "project-kickoff")
  description: string;           // Clear description of what the prompt does
  arguments: PromptArgument[];   // Structured arguments with names, descriptions, and defaults
  category?: string;             // Category for organization (e.g., "project-management")
  tags?: string[];               // Tags for easier discovery
  template?: string;             // Template string with {{variable}} placeholders
  messages?: PromptMessage[];    // Predefined message sequence
  metadata?: Record<string, any>; // Additional metadata
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

## Example Workflow

1. **Create a Project**
   ```
   Use create_project with:
   - workingDirectory="/path/to/your/project"
   - name="Website Redesign"
   - description="Complete overhaul of company website"
   ```

2. **Add Enhanced Tasks**
   ```
   Use create_task with:
   - workingDirectory="/path/to/your/project"
   - name="Design mockups"
   - details="Create wireframes and high-fidelity designs"
   - projectId="[project-id-from-step-1]"
   - priority=8 (high priority)
   - complexity=6 (above average complexity)
   - status="pending"
   - tags=["design", "ui", "mockups"]
   - estimatedHours=16
   ```

3. **Break Down Tasks**
   ```
   Use create_subtask with:
   - workingDirectory="/path/to/your/project"
   - name="Create wireframes"
   - details="Sketch basic layout structure"
   - taskId="[task-id-from-step-2]"
   ```

4. **Track Progress**
   ```
   Use update_task and update_subtask to mark items as completed
   Use list_projects, list_tasks, and list_subtasks to view progress
   (All with workingDirectory parameter)
   ```

### Agent Memories Workflow

1. **Create a Memory**
   ```
   Use create_memory with:
   - workingDirectory="/path/to/your/project"
   - title="User prefers concise technical responses"
   - content="The user has explicitly stated they prefer concise responses with technical explanations. They value brevity but want detailed technical information when relevant."
   - metadata={"source": "conversation", "confidence": 0.9}
   - category="user_preferences"
   ```

2. **Search Memories**
   ```
   Use search_memories with:
   - workingDirectory="/path/to/your/project"
   - query="user preferences responses"
   - limit=5
   - threshold=0.3
   - category="user_preferences"
   ```

3. **List and Manage**
   ```
   Use list_memories to view all memories
   Use update_memory to modify existing memories (title, content, metadata, category)
   Use delete_memory to remove outdated memories
   (All with workingDirectory parameter)
   ```

**📖 Quick Start**: See [docs/QUICK_START_MEMORIES.md](docs/QUICK_START_MEMORIES.md) for a step-by-step guide to agent memories.

## Data Storage

- **Project-specific**: Each working directory has its own isolated task and memory data
- **File-based**: Task data stored in `.agentic-tools-mcp/tasks/`, memory data in `.agentic-tools-mcp/memories/`
- **Git-trackable**: All data can be committed alongside your project code
- **Persistent**: All data persists between server restarts
- **Atomic**: All operations are atomic to prevent data corruption
- **JSON Storage**: Simple file-based storage for efficient memory organization
- **Backup-friendly**: Simple file-based storage for easy backup and migration

### Storage Structure
```
your-project/
├── .agentic-tools-mcp/
│   ├── tasks/              # Task management data for this project
│   │   └── tasks.json      # Projects, tasks, and subtasks data
│   └── memories/           # JSON file storage for memories
│       ├── preferences/    # User preferences category
│       │   └── User_prefers_concise_technical_responses.json
│       ├── technical/      # Technical information category
│       │   └── React_TypeScript_project_with_strict_ESLint.json
│       └── context/        # Context information category
│           └── User_works_in_healthcare_needs_HIPAA_compliance.json
├── src/
├── package.json
└── README.md
```

### Working Directory Parameter
All MCP tools require a `workingDirectory` parameter that specifies:
- Where to store the `.agentic-tools-mcp/` folder (in project-specific mode)
- Which project's task and memory data to access
- Enables multiple projects to have separate task lists and memory stores

**Note**: When the server is started with the `--claude` flag, the `workingDirectory` parameter is ignored and a global user directory is used instead (`~/.agentic-tools-mcp/` on macOS/Linux or `C:\Users\{username}\.agentic-tools-mcp\` on Windows).

### Benefits of Project-Specific Storage
- **Git Integration**: Task and memory data can be committed with your code
- **Team Collaboration**: Share task lists and agent memories via version control
- **Project Isolation**: Each project has its own task management and memory system
- **Multi-Project Workflow**: Work on multiple projects simultaneously with isolated memories
- **Backup & Migration**: File-based storage travels with your code
- **Text Search**: Simple content-based memory search for intelligent context retrieval
- **Agent Continuity**: Persistent agent memories across sessions and deployments

## Error Handling

- **Validation**: All inputs are validated with comprehensive error messages
- **Directory Validation**: Ensures working directory exists and is accessible
- **Referential Integrity**: Prevents orphaned tasks/subtasks with cascade deletes
- **Unique Names**: Enforces unique names within scope (project/task)
- **Confirmation**: Destructive operations require explicit confirmation
- **Graceful Degradation**: Detailed error messages for troubleshooting
- **Storage Errors**: Clear messages when storage initialization fails

## Development

### Building from Source
```bash
git clone <repository>
cd agentic-tools-mcp
npm install
npm run build
npm start
```

### Project Structure
```
src/
├── features/
│   ├── task-management/
│   │   ├── tools/           # MCP tool implementations
│   │   │   ├── projects/    # Project CRUD operations
│   │   │   ├── tasks/       # Task CRUD operations
│   │   │   └── subtasks/    # Subtask CRUD operations
│   │   ├── models/          # TypeScript interfaces
│   │   └── storage/         # Data persistence layer
│   └── agent-memories/
│       ├── tools/           # Memory MCP tool implementations
│       │   └── memories/    # Memory CRUD operations
│       ├── models/          # Memory TypeScript interfaces
│       └── storage/         # JSON file storage implementation
├── server.ts            # MCP server configuration
└── index.ts             # Entry point
```

## Troubleshooting

### Common Issues

**"Working directory does not exist"**
- Ensure the path exists and is accessible
- Use absolute paths for reliability
- Check directory permissions

**"Text search returns no results"** (Agent Memories)
- Try using different keywords or phrases
- Check that memories contain the search terms
- Verify that the query content matches memory content

**"Memory files not found"** (Agent Memories)
- Ensure the working directory exists and is writable
- Check that the .agentic-tools-mcp/memories directory was created

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.

### Current Version: 1.7.0
- ✅ **Enhanced Task Management**: Rich metadata with dependencies, priority, complexity, status, tags, and time tracking
- ✅ **Advanced AI Agent Tools**: PRD parsing, task recommendations, complexity analysis, progress inference, and research guidance
- ✅ **Intelligent Task Dependencies**: Dependency validation and workflow management
- ✅ **Priority & Complexity System**: 1-10 scale prioritization and complexity estimation
- ✅ **Enhanced Status Workflow**: pending → in-progress → blocked → done status tracking
- ✅ **Tag-Based Organization**: Flexible categorization and filtering system
- ✅ **Time Tracking**: Estimated and actual hours for project planning
- ✅ **Hybrid Research Integration**: Web research with memory caching for AI agents
- ✅ **Complete task management system** with hierarchical organization
- ✅ **Agent memories** with title/content architecture and JSON file storage
- ✅ **Intelligent multi-field search** with relevance scoring
- ✅ **Project-specific storage** with comprehensive MCP tools
- ✅ **Global directory mode** with --claude flag for Claude Desktop
- ✅ **VS Code extension ecosystem** integration

## Acknowledgments

We're grateful to the open-source community and the following projects that make this MCP server possible:

### Core Technologies
- **[@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)** - The foundation for MCP server implementation
- **[Node.js File System](https://nodejs.org/api/fs.html)** - Reliable file-based storage for memory persistence
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Node.js](https://nodejs.org/)** - JavaScript runtime environment

### Development & Validation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation for robust input handling
- **[ESLint](https://eslint.org/)** - Code quality and consistency
- **[Prettier](https://prettier.io/)** - Code formatting

### File Storage & Search
- **JSON** - Simple, human-readable data format for memory storage
- **Text Search** - Efficient content-based search across memory files

### Special Thanks
- **Open Source Community** - For creating the tools and libraries that make this project possible

## System Prompts

The server includes 8 pre-built prompt templates for common workflows. Initialize them with the `initialize_system_prompts` tool:

### 1. **project-kickoff**
Initialize new projects with standard structure and initial tasks.
- Arguments: `projectType` (required), `projectName` (required), `techStack`, `description`

### 2. **daily-standup**
Generate daily standup reports with progress and blockers.
- Arguments: `projectId`, `lookbackDays` (default: 1)

### 3. **sprint-planning**
Plan sprints based on priorities and capacity.
- Arguments: `sprintDuration` (required), `teamCapacity` (required), `projectId`, `focusAreas`

### 4. **code-review-checklist**
Generate context-specific code review checklists.
- Arguments: `taskId` (required), `files`, `prNumber`

### 5. **technical-decision**
Document technical decisions with ADR format.
- Arguments: `decision` (required), `context` (required), `alternatives`, `consequences`

### 6. **breakdown-complex-task**
Intelligently break down complex tasks into subtasks.
- Arguments: `taskId` (required), `targetComplexity` (default: 3), `maxSubtasks` (default: 10)

### 7. **find-solution**
Search memories and research for problem solutions.
- Arguments: `problem` (required), `context`, `searchExternal` (default: false)

### 8. **progress-report**
Generate comprehensive project progress reports.
- Arguments: `reportType` (required), `projectId`, `includeMetrics` (default: true), `period` (default: "last week")

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Setup
```bash
git clone <repository>
cd agentic-tools-mcp
npm install
npm run build
npm start
```

## Related Projects

### 🖥️ VS Code Extension
**[Agentic Tools MCP Companion](https://github.com/Pimzino/agentic-tools-mcp-companion)** - A beautiful VS Code extension that provides a GUI interface for this MCP server.

**Key Features:**
- 🎯 **Visual Task Management**: Rich GUI with enhanced task metadata forms
- 📝 **Enhanced Forms**: Priority, complexity, status, tags, and time tracking
- 🎨 **Visual Indicators**: Status emojis, priority badges, and complexity indicators
- 📊 **Rich Tooltips**: Complete task information on hover
- 🔄 **Real-time Sync**: Instant synchronization with MCP server data
- � **Responsive Design**: Adaptive forms that work on different screen sizes

**Perfect for:**
- Visual task management and planning
- Teams who prefer GUI interfaces
- Project managers who need rich task metadata
- Anyone who wants beautiful task organization in VS Code

## Support

For issues and questions, please use the GitHub issue tracker.

### Documentation
- 📖 **[API Reference](docs/API_REFERENCE.md)** - Complete tool documentation
- 🧠 **[Agent Memories Guide](docs/AGENT_MEMORIES.md)** - Comprehensive memory system guide
- 🚀 **[Quick Start: Memories](docs/QUICK_START_MEMORIES.md)** - Get started with agent memories
- 📋 **[Changelog](CHANGELOG.md)** - Version history and release notes

### Getting Help
- 🐛 Report bugs via GitHub issues
- 💡 Request features via GitHub discussions
- 🖥️ **VS Code Extension Issues**: Report extension-specific issues at [agentic-tools-mcp-companion](https://github.com/Pimzino/agentic-tools-mcp-companion/issues)
