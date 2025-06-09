import { z } from 'zod';
import { createTool, ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { getWorkingDirectoryDescription } from '../../utils/storage-config.js';
import { DualDocStorage } from '../../features/documentation/storage/dual-storage.js';
import { WebScraper } from '../../features/documentation/scrapers/web-scraper.js';
import { Document } from '../../features/documentation/models/index.js';
import { randomUUID } from 'crypto';

export function createDocumentationTools(registry: ToolRegistry): ToolDefinition[] {
  const config = registry.config;
  
  return [
    // Scrape Documentation
    createTool(
      'scrape_docs',
      'Scrape and index documentation from a URL for a library or framework',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        url: z.string().url().describe('The URL to scrape documentation from'),
        library: z.string().describe('The name of the library/framework'),
        version: z.string().optional().describe('The version of the library (default: "latest")'),
        projectSpecific: z.boolean().optional().describe('Whether to store in project-specific storage (default: true)')
      }),
      async ({ workingDirectory, url, library, version = 'latest', projectSpecific = true }) => {
        const storage = new DualDocStorage(workingDirectory, config);
        await storage.initialize();
        
        const scraper = new WebScraper();
        
        try {
          // Scrape the URL
          const { content, metadata } = await scraper.scrapeUrl(url);
          
          // Create document
          const document: Document = {
            id: randomUUID(),
            library,
            version,
            url,
            content,
            metadata: {
              ...metadata,
              source: 'web'
            },
            projectId: projectSpecific ? 'current' : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Save to appropriate storage
          const targetStorage = projectSpecific ? storage.project : storage.global;
          await targetStorage.saveDocument(document);
          
          return {
            content: [{
              type: 'text' as const,
              text: `Successfully scraped documentation for ${library} v${version}\n\n` +
                    `Document ID: ${document.id}\n` +
                    `Title: ${metadata.title || 'Untitled'}\n` +
                    `Content length: ${content.length} characters\n` +
                    `Storage: ${projectSpecific ? 'project' : 'global'}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text' as const,
              text: `Failed to scrape documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    ),

    // Search Documentation
    createTool(
      'search_docs',
      'Search through indexed documentation using text matching',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        query: z.string().describe('The search query'),
        limit: z.number().min(1).max(50).optional().describe('Maximum number of results to return (default: 10)'),
        searchGlobal: z.boolean().optional().describe('Whether to search global documentation as well (default: true)')
      }),
      async ({ workingDirectory, query, limit = 10, searchGlobal = true }) => {
        const storage = new DualDocStorage(workingDirectory, config);
        await storage.initialize();
        
        try {
          let results;
          
          if (searchGlobal) {
            // Search both project and global storage
            results = await storage.searchDocuments(query, limit);
          } else {
            // Search only project storage
            results = await storage.project.searchDocuments(query, limit);
          }

          if (results.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: `No documentation found for query: "${query}"`
              }]
            };
          }

          // Format results
          const formattedResults = results.map((result, index) => 
            `${index + 1}. ${result.document.library} v${result.document.version} - ${result.document.metadata.title || 'Untitled'}\n` +
            `   URL: ${result.document.url}\n` +
            `   Score: ${result.score.toFixed(2)}\n` +
            `   Storage: ${result.document.projectId ? 'project' : 'global'}\n` +
            `   Snippet: ${result.highlights?.[0] || result.document.content.substring(0, 150) + '...'}`
          ).join('\n\n');

          return {
            content: [{
              type: 'text' as const,
              text: `Found ${results.length} result(s) for "${query}":\n\n${formattedResults}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text' as const,
              text: `Failed to search documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    ),

    // List Libraries
    createTool(
      'list_libraries',
      'List all indexed documentation libraries',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        includeGlobal: z.boolean().optional().describe('Whether to include global libraries (default: true)')
      }),
      async ({ workingDirectory, includeGlobal = true }) => {
        const storage = new DualDocStorage(workingDirectory, config);
        await storage.initialize();
        
        try {
          const projectLibraries = await storage.project.getLibraries();
          const globalLibraries = includeGlobal ? await storage.global.getLibraries() : [];

          // Merge libraries, avoiding duplicates
          const libraryMap = new Map<string, any>();
          
          // Add project libraries first (higher priority)
          for (const lib of projectLibraries) {
            libraryMap.set(lib.name, {
              ...lib,
              storage: 'project'
            });
          }

          // Add global libraries (don't override project ones)
          for (const lib of globalLibraries) {
            if (!libraryMap.has(lib.name)) {
              libraryMap.set(lib.name, {
                ...lib,
                storage: 'global'
              });
            } else {
              // Merge versions from global if not in project
              const existing = libraryMap.get(lib.name);
              const newVersions = lib.versions.filter(v => !existing.versions.includes(v));
              if (newVersions.length > 0) {
                existing.versions = [...existing.versions, ...newVersions];
                existing.storage = 'both';
              }
            }
          }

          const libraries = Array.from(libraryMap.values());
          
          if (libraries.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: 'No documentation libraries found.'
              }]
            };
          }
          
          // Get statistics
          const projectStats = await storage.project.getStatistics();
          const globalStats = includeGlobal ? await storage.global.getStatistics() : null;

          // Format libraries
          const formattedLibraries = libraries
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(lib => 
              `- ${lib.name} (${lib.versions.join(', ')})\n` +
              `  Storage: ${lib.storage}\n` +
              `  Last scraped: ${lib.lastScraped}`
            ).join('\n\n');

          let statsText = `\nProject storage: ${projectStats.totalDocuments} documents in ${projectStats.totalLibraries} libraries`;
          if (globalStats) {
            statsText += `\nGlobal storage: ${globalStats.totalDocuments} documents in ${globalStats.totalLibraries} libraries`;
          }

          return {
            content: [{
              type: 'text' as const,
              text: `Found ${libraries.length} libraries:\n\n${formattedLibraries}\n${statsText}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text' as const,
              text: `Failed to list libraries: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    ),

    // Remove Documentation
    createTool(
      'remove_docs',
      'Remove documentation for a library from storage',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        library: z.string().describe('The name of the library to remove'),
        version: z.string().optional().describe('Specific version to remove (removes all versions if not specified)'),
        storage: z.enum(['project', 'global', 'both']).optional().describe('Which storage to remove from (default: "project")'),
        confirm: z.boolean().describe('Must be set to true to confirm deletion')
      }),
      async ({ workingDirectory, library, version, storage = 'project', confirm }) => {
        if (!confirm) {
          return {
            content: [{
              type: 'text' as const,
              text: 'Please set confirm to true to delete documentation'
            }],
            isError: true
          };
        }

        const dualStorage = new DualDocStorage(workingDirectory, config);
        await dualStorage.initialize();
        
        try {
          let deletedCount = 0;
          const results: string[] = [];

          if (version) {
            // Remove specific version
            if (storage === 'project' || storage === 'both') {
              const doc = await dualStorage.project.getDocument(library, version);
              if (doc) {
                const success = await dualStorage.project.deleteDocument(doc.id);
                if (success) {
                  deletedCount++;
                  results.push(`Removed ${library} v${version} from project storage`);
                }
              }
            }

            if (storage === 'global' || storage === 'both') {
              const doc = await dualStorage.global.getDocument(library, version);
              if (doc) {
                const success = await dualStorage.global.deleteDocument(doc.id);
                if (success) {
                  deletedCount++;
                  results.push(`Removed ${library} v${version} from global storage`);
                }
              }
            }
          } else {
            // Remove entire library
            if (storage === 'project' || storage === 'both') {
              const success = await dualStorage.project.deleteLibrary(library);
              if (success) {
                deletedCount++;
                results.push(`Removed all versions of ${library} from project storage`);
              }
            }

            if (storage === 'global' || storage === 'both') {
              const success = await dualStorage.global.deleteLibrary(library);
              if (success) {
                deletedCount++;
                results.push(`Removed all versions of ${library} from global storage`);
              }
            }
          }

          if (deletedCount === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: 'No documentation found to remove'
              }]
            };
          }

          return {
            content: [{
              type: 'text' as const,
              text: results.join('\n')
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text' as const,
              text: `Failed to remove documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    )
  ];
}