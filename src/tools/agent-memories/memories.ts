import { z } from 'zod';
import { createTool, ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { getWorkingDirectoryDescription } from '../../utils/storage-config.js';
import { createCreateMemoryTool } from '../../features/agent-memories/tools/memories/create.js';
import { createSearchMemoriesTool } from '../../features/agent-memories/tools/memories/search.js';
import { createGetMemoryTool } from '../../features/agent-memories/tools/memories/get.js';
import { createListMemoriesTool } from '../../features/agent-memories/tools/memories/list.js';
import { createUpdateMemoryTool } from '../../features/agent-memories/tools/memories/update.js';
import { createDeleteMemoryTool } from '../../features/agent-memories/tools/memories/delete.js';

export function createMemoryTools(registry: ToolRegistry): ToolDefinition[] {
  const config = registry.config;
  
  return [
    // Create Memory
    createTool(
      'create_memory',
      'Capture and preserve important information, insights, or context as searchable memories with intelligent file-based storage. Ideal for building a knowledge base of user preferences, technical decisions, project context, or any information you want to remember and retrieve later with organized categorization.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        title: z.string().describe('Short title for the memory (max 50 characters for better file organization)'),
        content: z.string().describe('Detailed memory content/text (no character limit)'),
        metadata: z.record(z.any()).optional().describe('Optional metadata as key-value pairs for additional context'),
        category: z.string().optional().describe('Optional category to organize memories (e.g., "user_preferences", "project_context")'),
      }),
      async ({ workingDirectory, title, content, metadata, category }) => {
        const storage = await registry.createMemoryStorage(workingDirectory);
        const tool = createCreateMemoryTool(storage);
        return await tool.handler({ title, content, metadata, category });
      }
    ),

    // Search Memories
    createTool(
      'search_memories',
      'Intelligently search through your stored memories using advanced text matching algorithms to quickly find relevant information. Features multi-field search across titles, content, and metadata with customizable relevance scoring - perfect for retrieving past decisions, preferences, or contextual information when you need it most.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        query: z.string().describe('The search query text to find matching memories'),
        limit: z.number().min(1).max(100).optional().describe('Maximum number of results to return (default: 10)'),
        threshold: z.number().min(0).max(1).optional().describe('Minimum relevance threshold 0-1 (default: 0.3)'),
        category: z.string().optional().describe('Filter results to memories in this specific category'),
      }),
      async ({ workingDirectory, query, limit, threshold, category }) => {
        const storage = await registry.createMemoryStorage(workingDirectory);
        const tool = createSearchMemoriesTool(storage);
        return await tool.handler({ query, limit, threshold, category });
      }
    ),

    // Get Memory
    createTool(
      'get_memory',
      'Access comprehensive memory details including full content, metadata, creation history, and categorization. Essential for reviewing stored knowledge, understanding context, and retrieving complete information when making decisions or referencing past insights.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the memory to retrieve'),
      }),
      async ({ workingDirectory, id }) => {
        const storage = await registry.createMemoryStorage(workingDirectory);
        const tool = createGetMemoryTool(storage);
        return await tool.handler({ id });
      }
    ),

    // List Memories
    createTool(
      'list_memories',
      'Browse and explore your knowledge repository with organized memory listings and flexible category filtering. Perfect for reviewing stored information, discovering patterns in your knowledge base, and maintaining awareness of your accumulated insights and decisions.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        category: z.string().optional().describe('Filter to memories in this specific category'),
        limit: z.number().min(1).max(1000).optional().describe('Maximum number of memories to return (default: 50)'),
      }),
      async ({ workingDirectory, category, limit }) => {
        const storage = await registry.createMemoryStorage(workingDirectory);
        const tool = createListMemoriesTool(storage);
        return await tool.handler({ category, limit });
      }
    ),

    // Update Memory
    createTool(
      'update_memory',
      'Evolve and refine your stored knowledge with flexible updates to content, categorization, and metadata. Keep your memory repository current and accurate as understanding deepens, ensuring your knowledge base remains a reliable source of up-to-date insights and decisions.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the memory to update'),
        title: z.string().optional().describe('New title for the memory (max 50 characters for better file organization)'),
        content: z.string().optional().describe('New detailed content for the memory (no character limit)'),
        metadata: z.record(z.any()).optional().describe('New metadata as key-value pairs (replaces existing metadata)'),
        category: z.string().optional().describe('New category for organizing the memory'),
      }),
      async ({ workingDirectory, id, title, content, metadata, category }) => {
        const storage = await registry.createMemoryStorage(workingDirectory);
        const tool = createUpdateMemoryTool(storage);
        return await tool.handler({ id, title, content, metadata, category });
      }
    ),

    // Delete Memory
    createTool(
      'delete_memory',
      'Safely remove outdated or irrelevant memories from your knowledge repository with built-in confirmation safeguards. Maintain a clean, focused memory collection while protecting against accidental loss of valuable information through required confirmation protocols.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        id: z.string().describe('The unique identifier of the memory to delete'),
        confirm: z.boolean().describe('Must be set to true to confirm deletion (safety measure)'),
      }),
      async ({ workingDirectory, id, confirm }) => {
        const storage = await registry.createMemoryStorage(workingDirectory);
        const tool = createDeleteMemoryTool(storage);
        return await tool.handler({ id, confirm });
      }
    ),
  ];
}