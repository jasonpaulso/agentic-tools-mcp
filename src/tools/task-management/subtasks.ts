import { z } from 'zod';
import { createTool, ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { getWorkingDirectoryDescription } from '../../utils/storage-config.js';
import { createListSubtasksTool } from '../../features/task-management/tools/subtasks/list.js';
import { createCreateSubtaskTool } from '../../features/task-management/tools/subtasks/create.js';
import { createGetSubtaskTool } from '../../features/task-management/tools/subtasks/get.js';
import { createUpdateSubtaskTool } from '../../features/task-management/tools/subtasks/update.js';
import { createDeleteSubtaskTool } from '../../features/task-management/tools/subtasks/delete.js';

export function createSubtaskTools(registry: ToolRegistry): ToolDefinition[] {
  const config = registry['config'];
  
  return [
    // List Subtasks
    createTool(
      'list_subtasks',
      'Navigate your detailed work breakdown with granular subtask visibility and flexible filtering options. Perfect for sprint planning, daily standups, and detailed progress tracking across the complete project hierarchy from high-level goals to specific implementation steps.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        taskId: z.string().optional().describe('Filter subtasks to only those belonging to this task (optional)'),
        projectId: z.string().optional().describe('Filter subtasks to only those in this project (optional)'),
      }),
      async ({ workingDirectory, taskId, projectId }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createListSubtasksTool(storage);
        return await tool.handler({ taskId, projectId });
      }
    ),

    // Create Subtask
    createTool(
      'create_subtask',
      'Break down complex tasks into precise, actionable subtasks with detailed specifications and clear ownership. Enable granular progress tracking and team coordination by decomposing work into manageable, measurable components within your hierarchical project structure.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        name: z.string().describe('The name/title of the new subtask'),
        details: z.string().describe('Detailed description of what the subtask involves'),
        taskId: z.string().describe('The ID of the parent task this subtask belongs to'),
      }),
      async ({ workingDirectory, name, details, taskId }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createCreateSubtaskTool(storage);
        return await tool.handler({ name, details, taskId });
      }
    ),

    // Get Subtask
    createTool(
      'get_subtask',
      'Examine subtask details with comprehensive context including parent task relationships, progress status, and implementation specifics. Essential for detailed work planning, progress assessment, and understanding the complete scope of granular work items.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the subtask to retrieve'),
      }),
      async ({ workingDirectory, id }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createGetSubtaskTool(storage);
        return await tool.handler({ id });
      }
    ),

    // Update Subtask
    createTool(
      'update_subtask',
      'Fine-tune subtask specifications and track completion progress with flexible updates to names, descriptions, and status. Maintain accurate, up-to-date work records that reflect evolving requirements and real-time progress in your detailed project execution.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the subtask to update'),
        name: z.string().optional().describe('New name/title for the subtask (optional)'),
        details: z.string().optional().describe('New detailed description for the subtask (optional)'),
        completed: z.boolean().optional().describe('Mark subtask as completed (true) or incomplete (false) (optional)'),
      }),
      async ({ workingDirectory, id, name, details, completed }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createUpdateSubtaskTool(storage);
        return await tool.handler({ id, name, details, completed });
      }
    ),

    // Delete Subtask
    createTool(
      'delete_subtask',
      'Clean up your detailed work breakdown by safely removing completed or obsolete subtasks with confirmation safeguards. Maintain focus on current priorities while preserving data integrity through required confirmation protocols.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the subtask to delete'),
        confirm: z.boolean().describe('Must be set to true to confirm deletion (safety measure)'),
      }),
      async ({ workingDirectory, id, confirm }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createDeleteSubtaskTool(storage);
        return await tool.handler({ id, confirm });
      }
    ),
  ];
}