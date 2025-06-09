import { z } from 'zod';
import { createTool, ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { getWorkingDirectoryDescription } from '../../utils/storage-config.js';
import { createListProjectsTool } from '../../features/task-management/tools/projects/list.js';
import { createCreateProjectTool } from '../../features/task-management/tools/projects/create.js';
import { createGetProjectTool } from '../../features/task-management/tools/projects/get.js';
import { createUpdateProjectTool } from '../../features/task-management/tools/projects/update.js';
import { createDeleteProjectTool } from '../../features/task-management/tools/projects/delete.js';

export function createProjectTools(registry: ToolRegistry): ToolDefinition[] {
  const config = registry.config;
  
  return [
    // List Projects
    createTool(
      'list_projects',
      'Discover and overview all your projects with comprehensive details and progress insights. Perfect for getting a bird\'s-eye view of your work portfolio, tracking project status, and quickly navigating between different initiatives in your workspace with project-specific storage.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
      }),
      async ({ workingDirectory }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createListProjectsTool(storage);
        return await tool.handler();
      }
    ),

    // Create Project
    createTool(
      'create_project',
      'Launch new projects with structured organization and detailed documentation. Establishes a solid foundation for task management with Git-trackable project data, enabling seamless collaboration and progress tracking across your development workflow.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        name: z.string().describe('The name of the new project'),
        description: z.string().describe('A detailed description of the project'),
      }),
      async ({ workingDirectory, name, description }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createCreateProjectTool(storage);
        return await tool.handler({ name, description });
      }
    ),

    // Get Project
    createTool(
      'get_project',
      'Access comprehensive project details including metadata, creation dates, and current status. Essential for project analysis, reporting, and understanding project context when planning tasks or reviewing progress in your development workflow.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the project to retrieve'),
      }),
      async ({ workingDirectory, id }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createGetProjectTool(storage);
        return await tool.handler({ id });
      }
    ),

    // Update Project
    createTool(
      'update_project',
      'Evolve and refine your project information as requirements change and scope develops. Maintain accurate project documentation with flexible updates to names and descriptions, ensuring your project data stays current and meaningful throughout the development lifecycle.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the project to update'),
        name: z.string().optional().describe('New name for the project (optional)'),
        description: z.string().optional().describe('New description for the project (optional)'),
      }),
      async ({ workingDirectory, id, name, description }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createUpdateProjectTool(storage);
        return await tool.handler({ id, name, description });
      }
    ),

    // Delete Project
    createTool(
      'delete_project',
      'Safely remove completed or obsolete projects from your workspace with built-in confirmation safeguards. Permanently cleans up project data while protecting against accidental deletions, helping maintain an organized and current project portfolio.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the project to delete'),
        confirm: z.boolean().describe('Must be set to true to confirm deletion (safety measure)'),
      }),
      async ({ workingDirectory, id, confirm }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createDeleteProjectTool(storage);
        return await tool.handler({ id, confirm });
      }
    ),
  ];
}