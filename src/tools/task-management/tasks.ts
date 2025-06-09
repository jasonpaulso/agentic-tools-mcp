import { z } from 'zod';
import { createTool, ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { getWorkingDirectoryDescription } from '../../utils/storage-config.js';
import { createListTasksTool } from '../../features/task-management/tools/tasks/list.js';
import { createCreateTaskTool } from '../../features/task-management/tools/tasks/create.js';
import { createGetTaskTool } from '../../features/task-management/tools/tasks/get.js';
import { createUpdateTaskTool } from '../../features/task-management/tools/tasks/update.js';
import { createDeleteTaskTool } from '../../features/task-management/tools/tasks/delete.js';

export function createTaskTools(registry: ToolRegistry): ToolDefinition[] {
  const config = registry.config;
  
  return [
    // List Tasks
    createTool(
      'list_tasks',
      'Explore and organize your task portfolio with intelligent filtering and comprehensive progress tracking. View all tasks across projects or focus on specific project tasks, perfect for sprint planning, progress reviews, and maintaining productivity momentum.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        projectId: z.string().optional().describe('Filter tasks to only those belonging to this project (optional)'),
      }),
      async ({ workingDirectory, projectId }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createListTasksTool(storage);
        return await tool.handler({ projectId });
      }
    ),

    // Create Task
    createTool(
      'create_task',
      'Transform project goals into actionable, trackable tasks with advanced features including dependencies, priorities, complexity estimation, and workflow management. Build structured workflows that break down complex projects into manageable components.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        name: z.string().describe('The name/title of the new task'),
        details: z.string().describe('Detailed description of what the task involves'),
        projectId: z.string().describe('The ID of the project this task belongs to'),
        dependsOn: z.array(z.string()).optional().describe('Array of task IDs that must be completed before this task'),
        priority: z.number().min(1).max(10).optional().describe('Task priority level (1-10, where 10 is highest priority)'),
        complexity: z.number().min(1).max(10).optional().describe('Estimated complexity/effort (1-10, where 10 is most complex)'),
        status: z.enum(['pending', 'in-progress', 'blocked', 'done']).optional().describe('Initial task status (defaults to pending)'),
        tags: z.array(z.string()).optional().describe('Tags for categorization and filtering'),
        estimatedHours: z.number().min(0).optional().describe('Estimated time to complete in hours'),
      }),
      async ({ workingDirectory, ...taskData }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createCreateTaskTool(storage);
        return await tool.handler(taskData);
      }
    ),

    // Get Task
    createTool(
      'get_task',
      'Deep-dive into task specifics with comprehensive details including progress status, creation history, and full context. Essential for task analysis, status reporting, and understanding dependencies when planning work or conducting progress reviews.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the task to retrieve'),
      }),
      async ({ workingDirectory, id }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createGetTaskTool(storage);
        return await tool.handler({ id });
      }
    ),

    // Update Task
    createTool(
      'update_task',
      'Adapt and refine tasks with comprehensive updates including dependencies, priorities, complexity, status, tags, and time tracking. Keep your workflow current and accurate with advanced project management capabilities.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the task to update'),
        name: z.string().optional().describe('New name/title for the task (optional)'),
        details: z.string().optional().describe('New detailed description for the task (optional)'),
        completed: z.boolean().optional().describe('Mark task as completed (true) or incomplete (false) (optional)'),
        dependsOn: z.array(z.string()).optional().describe('Updated array of task IDs that must be completed before this task'),
        priority: z.number().min(1).max(10).optional().describe('Updated task priority level (1-10, where 10 is highest priority)'),
        complexity: z.number().min(1).max(10).optional().describe('Updated complexity/effort estimate (1-10, where 10 is most complex)'),
        status: z.enum(['pending', 'in-progress', 'blocked', 'done']).optional().describe('Updated task status'),
        tags: z.array(z.string()).optional().describe('Updated tags for categorization and filtering'),
        estimatedHours: z.number().min(0).optional().describe('Updated estimated time to complete in hours'),
        actualHours: z.number().min(0).optional().describe('Actual time spent on the task in hours'),
      }),
      async ({ workingDirectory, ...updateData }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createUpdateTaskTool(storage);
        return await tool.handler(updateData);
      }
    ),

    // Delete Task
    createTool(
      'delete_task',
      'Streamline your workflow by safely removing obsolete or completed tasks with built-in confirmation protection. Maintain a clean, focused task environment while preventing accidental data loss through required confirmation safeguards.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the task to delete'),
        confirm: z.boolean().describe('Must be set to true to confirm deletion (safety measure)'),
      }),
      async ({ workingDirectory, id, confirm }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createDeleteTaskTool(storage);
        return await tool.handler({ id, confirm });
      }
    ),
  ];
}