import { z } from 'zod';
import { createTool, ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { getWorkingDirectoryDescription } from '../../utils/storage-config.js';
import {
  createCreatePromptTool,
  createListPromptsTool,
  createGetPromptTool,
  createUpdatePromptTool,
  createDeletePromptTool,
  createSearchPromptsTool,
  createExecutePromptTool,
  createInitializeSystemPromptsTool,
} from '../../features/prompts/tools/index.js';

// Zod schema for prompt arguments
const promptArgumentSchema = z.object({
  name: z.string(),
  description: z.string(),
  required: z.boolean(),
  default: z.any().optional(),
});

// Zod schema for prompt messages
const promptMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.object({
    type: z.enum(['text', 'image', 'resource']),
    text: z.string().optional(),
    data: z.string().optional(),
    mimeType: z.string().optional(),
    uri: z.string().optional(),
  }),
});

export function createPromptTools(registry: ToolRegistry): ToolDefinition[] {
  const config = registry.config;

  return [
    // Create Prompt
    createTool(
      'create_prompt',
      'Create a new reusable prompt template with structured arguments and predefined messages for consistent AI interactions',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        name: z.string().describe('Unique name for the prompt'),
        description: z.string().describe('Clear description of what the prompt does'),
        arguments: z.array(promptArgumentSchema).optional().describe('List of arguments the prompt accepts'),
        category: z.string().optional().describe('Category to organize the prompt (e.g., "planning", "development", "documentation")'),
        tags: z.array(z.string()).optional().describe('Tags for easier discovery'),
        template: z.string().optional().describe('Template string with {{variable}} placeholders'),
        messages: z.array(promptMessageSchema).optional().describe('Predefined message sequence'),
        metadata: z.record(z.any()).optional().describe('Additional metadata'),
      }),
      async ({ workingDirectory, ...promptData }) => {
        const resolvedDirectory = registry.config.useGlobalDirectory 
          ? registry.config.useGlobalDirectory 
          : workingDirectory;
        const storage = await registry.createPromptStorage(resolvedDirectory);
        const tool = createCreatePromptTool(storage);
        return await tool.handler(promptData);
      }
    ),

    // List Prompts
    createTool(
      'list_prompts',
      'Browse available prompt templates organized by category to find reusable AI interaction patterns',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        category: z.string().optional().describe('Filter by specific category'),
      }),
      async ({ workingDirectory, category }) => {
        const resolvedDirectory = registry.config.useGlobalDirectory 
          ? registry.config.useGlobalDirectory 
          : workingDirectory;
        const storage = await registry.createPromptStorage(resolvedDirectory);
        const tool = createListPromptsTool(storage);
        return await tool.handler({ category });
      }
    ),

    // Get Prompt
    createTool(
      'get_prompt',
      'View detailed information about a specific prompt template including arguments and message structure',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The prompt ID'),
      }),
      async ({ workingDirectory, id }) => {
        const resolvedDirectory = registry.config.useGlobalDirectory 
          ? registry.config.useGlobalDirectory 
          : workingDirectory;
        const storage = await registry.createPromptStorage(resolvedDirectory);
        const tool = createGetPromptTool(storage);
        return await tool.handler({ id });
      }
    ),

    // Update Prompt
    createTool(
      'update_prompt',
      'Modify an existing prompt template to refine arguments, messages, or metadata',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The prompt ID to update'),
        name: z.string().optional().describe('New name for the prompt'),
        description: z.string().optional().describe('New description'),
        arguments: z.array(promptArgumentSchema).optional().describe('Updated arguments list'),
        category: z.string().optional().describe('New category'),
        tags: z.array(z.string()).optional().describe('Updated tags'),
        template: z.string().optional().describe('Updated template string'),
        messages: z.array(promptMessageSchema).optional().describe('Updated message sequence'),
        metadata: z.record(z.any()).optional().describe('Updated metadata'),
      }),
      async ({ workingDirectory, ...updates }) => {
        const resolvedDirectory = registry.config.useGlobalDirectory 
          ? registry.config.useGlobalDirectory 
          : workingDirectory;
        const storage = await registry.createPromptStorage(resolvedDirectory);
        const tool = createUpdatePromptTool(storage);
        return await tool.handler(updates);
      }
    ),

    // Delete Prompt
    createTool(
      'delete_prompt',
      'Remove a prompt template from the system with confirmation safeguard',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The prompt ID to delete'),
        confirm: z.boolean().describe('Must be true to confirm deletion'),
      }),
      async ({ workingDirectory, id, confirm }) => {
        const resolvedDirectory = registry.config.useGlobalDirectory 
          ? registry.config.useGlobalDirectory 
          : workingDirectory;
        const storage = await registry.createPromptStorage(resolvedDirectory);
        const tool = createDeletePromptTool(storage);
        return await tool.handler({ id, confirm });
      }
    ),

    // Search Prompts
    createTool(
      'search_prompts',
      'Find prompt templates by searching names, descriptions, categories, and tags',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        query: z.string().describe('Search query'),
      }),
      async ({ workingDirectory, query }) => {
        const resolvedDirectory = registry.config.useGlobalDirectory 
          ? registry.config.useGlobalDirectory 
          : workingDirectory;
        const storage = await registry.createPromptStorage(resolvedDirectory);
        const tool = createSearchPromptsTool(storage);
        return await tool.handler({ query });
      }
    ),

    // Execute Prompt
    createTool(
      'execute_prompt',
      'Execute a saved prompt template with provided arguments to generate formatted messages for AI interaction',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The prompt ID to execute'),
        arguments: z.record(z.any()).optional().describe('Arguments to pass to the prompt'),
      }),
      async ({ workingDirectory, id, arguments: args }) => {
        const resolvedDirectory = registry.config.useGlobalDirectory 
          ? registry.config.useGlobalDirectory 
          : workingDirectory;
        const storage = await registry.createPromptStorage(resolvedDirectory);
        const tool = createExecutePromptTool(storage);
        return await tool.handler({ id, arguments: args });
      }
    ),

    // Initialize System Prompts
    createTool(
      'initialize_system_prompts',
      'Initialize the system with pre-built prompt templates for common workflows like project kickoff, daily standups, and sprint planning',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
      }),
      async ({ workingDirectory }) => {
        const resolvedDirectory = registry.config.useGlobalDirectory 
          ? registry.config.useGlobalDirectory 
          : workingDirectory;
        const storage = await registry.createPromptStorage(resolvedDirectory);
        const tool = createInitializeSystemPromptsTool(storage);
        return await tool.handler();
      }
    ),
  ];
}