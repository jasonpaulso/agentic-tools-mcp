import { ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { createProjectTools } from './projects.js';
import { createTaskTools } from './tasks.js';
import { createSubtaskTools } from './subtasks.js';
import { createAdvancedTaskTools } from './advanced.js';

/**
 * Create all task management tools
 */
export function createTaskManagementTools(registry: ToolRegistry): ToolDefinition[] {
  return [
    ...createProjectTools(registry),
    ...createTaskTools(registry),
    ...createSubtaskTools(registry),
    ...createAdvancedTaskTools(registry),
  ];
}