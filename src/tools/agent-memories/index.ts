import { ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { createMemoryTools } from './memories.js';

/**
 * Create all agent memory tools
 */
export function createAgentMemoryTools(registry: ToolRegistry): ToolDefinition[] {
  return createMemoryTools(registry);
}