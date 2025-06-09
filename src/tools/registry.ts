import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolDefinition, ToolConfig } from './base-tool.js';
import { StorageConfig } from '../utils/storage-config.js';
import { FileStorage } from '../features/task-management/storage/file-storage.js';
import { FileStorage as MemoryFileStorage } from '../features/agent-memories/storage/file-storage.js';
import { FileStorage as PromptsFileStorage } from '../features/prompts/storage/file-storage.js';
import { resolveWorkingDirectory } from '../utils/storage-config.js';

/**
 * Tool registry for managing MCP tools
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  
  constructor(
    private server: McpServer,
    public readonly config: StorageConfig
  ) {}

  /**
   * Register a tool with the MCP server
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    
    this.server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      tool.handler
    );
  }

  /**
   * Register multiple tools at once
   */
  registerTools(tools: ToolDefinition[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Get all registered tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Create task storage instance
   */
  async createTaskStorage(workingDirectory: string): Promise<FileStorage> {
    const resolvedDirectory = resolveWorkingDirectory(workingDirectory, this.config);
    const storage = new FileStorage(resolvedDirectory);
    await storage.initialize();
    return storage;
  }

  /**
   * Create memory storage instance
   */
  async createMemoryStorage(workingDirectory: string): Promise<MemoryFileStorage> {
    const resolvedDirectory = resolveWorkingDirectory(workingDirectory, this.config);
    const storage = new MemoryFileStorage(resolvedDirectory);
    await storage.initialize();
    return storage;
  }

  /**
   * Create prompt storage instance
   */
  async createPromptStorage(workingDirectory: string): Promise<PromptsFileStorage> {
    const resolvedDirectory = resolveWorkingDirectory(workingDirectory, this.config);
    const storage = new PromptsFileStorage(resolvedDirectory);
    await storage.initialize();
    return storage;
  }
}