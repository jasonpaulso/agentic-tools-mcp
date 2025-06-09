import { z } from 'zod';
import { ToolRegistry } from '../registry.js';
import { createTool, ToolDefinition } from '../base-tool.js';
import { FileStorage as MemoryFileStorage } from '../../features/agent-memories/storage/file-storage.js';
import { DualDocStorage } from '../../features/documentation/storage/dual-storage.js';
import { FileStorage } from '../../features/task-management/storage/file-storage.js';
import { UnifiedSearchEngine } from '../../features/unified-search/index.js';
import { getWorkingDirectoryDescription, getGlobalStorageDirectory } from '../../utils/storage-config.js';
import { join } from 'path';

/**
 * Create unified search tools
 */
export function createUnifiedSearchTools(registry: ToolRegistry): ToolDefinition[] {
  const config = registry.config;
  
  return [
    createTool(
      'unified_search',
      'Search across all content types (memories, tasks, and documentation) with intelligent ranking and relevance scoring',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        query: z.string().describe('The search query'),
        includeMemories: z.boolean().default(true).describe('Include memories in search results'),
        includeTasks: z.boolean().default(true).describe('Include tasks in search results'),
        includeDocuments: z.boolean().default(true).describe('Include documentation in search results'),
        limit: z.number().default(20).describe('Maximum number of results to return'),
        minScore: z.number().default(0.1).describe('Minimum relevance score (0-1)')
      }),
      async ({ workingDirectory, query, includeMemories, includeTasks, includeDocuments, limit, minScore }) => {
        try {
          // Initialize storage instances
          const memoryStorage = new MemoryFileStorage(
            config.useGlobalDirectory 
              ? getGlobalStorageDirectory() 
              : join(workingDirectory, '.agentic-tools-mcp')
          );

          const taskStorage = new FileStorage(
            config.useGlobalDirectory 
              ? getGlobalStorageDirectory() 
              : join(workingDirectory, '.agentic-tools-mcp')
          );

          const docStorage = new DualDocStorage(
            workingDirectory,
            config
          );

          await memoryStorage.initialize();
          await taskStorage.initialize();
          await docStorage.initialize();

          // Create unified search engine
          const searchEngine = new UnifiedSearchEngine(
            memoryStorage,
            taskStorage,
            docStorage
          );

          // Perform search
          const results = await searchEngine.search(query, {
            includeMemories,
            includeTasks,
            includeDocuments,
            limit,
            minScore
          });

          // Format results for output
          const formattedResults = results.map(result => {
            switch (result.type) {
              case 'memory':
                const memoryResult = result.data as any;
                return {
                  type: 'memory',
                  score: result.score,
                  id: memoryResult.memory.id,
                  title: memoryResult.memory.title,
                  category: memoryResult.memory.category,
                  highlights: result.highlights,
                  createdAt: memoryResult.memory.createdAt
                };
              
              case 'task':
                const task = result.data as any;
                return {
                  type: 'task',
                  score: result.score,
                  id: task.id,
                  name: task.name,
                  status: task.status,
                  priority: task.priority,
                  project: task.projectId,
                  highlights: result.highlights,
                  createdAt: task.createdAt
                };
              
              case 'document':
                const docResult = result.data as any;
                return {
                  type: 'document',
                  score: result.score,
                  id: docResult.document.id,
                  library: docResult.document.library,
                  version: docResult.document.version,
                  title: docResult.document.metadata.title,
                  url: docResult.document.url,
                  highlights: result.highlights,
                  lastUpdated: docResult.document.updatedAt
                };
              
              default:
                return result;
            }
          });

          // Format results as text content
          let resultText = `Unified Search Results for: "${query}"\n`;
          resultText += `Total results: ${formattedResults.length}\n\n`;

          formattedResults.forEach((result: any, index) => {
            resultText += `${index + 1}. [${result.type.toUpperCase()}] ${result.score.toFixed(2)} relevance\n`;
            
            switch (result.type) {
              case 'memory':
                resultText += `   Title: ${result.title}\n`;
                resultText += `   Category: ${result.category || 'uncategorized'}\n`;
                resultText += `   Created: ${result.createdAt}\n`;
                break;
              case 'task':
                resultText += `   Name: ${result.name}\n`;
                resultText += `   Status: ${result.status}\n`;
                resultText += `   Priority: ${result.priority}/10\n`;
                resultText += `   Project: ${result.project}\n`;
                break;
              case 'document':
                resultText += `   Library: ${result.library} v${result.version}\n`;
                resultText += `   Title: ${result.title || 'Untitled'}\n`;
                resultText += `   URL: ${result.url}\n`;
                break;
            }
            
            if (result.highlights && result.highlights.length > 0) {
              resultText += `   Highlights:\n`;
              result.highlights.forEach((highlight: string) => {
                resultText += `     - ${highlight}\n`;
              });
            }
            
            resultText += '\n';
          });

          return {
            content: [{
              type: 'text' as const,
              text: resultText
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text' as const,
              text: `Failed to perform unified search: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    )
  ];
}