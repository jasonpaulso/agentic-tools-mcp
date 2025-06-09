import { z } from 'zod';
import { DualDocStorage } from '../../storage/dual-storage.js';
import { getStorageConfig } from '../../../../utils/storage-config.js';
import { WebScraper } from '../../scrapers/web-scraper.js';
import { DocumentStorage } from '../../storage/storage.js';

export class UpdateDocsTool {
  get definition() {
    return {
      name: 'update_docs',
      description: 'Check for and update outdated documentation',
      inputSchema: z.object({
        workingDirectory: z.string().describe('The full absolute path to the working directory'),
        maxAge: z.number().optional().default(7).describe('Maximum age in days before docs are considered outdated (default: 7)'),
        library: z.string().optional().describe('Specific library to check/update (if not provided, checks all)'),
        autoUpdate: z.boolean().default(false).describe('Automatically re-scrape outdated documentation'),
        storage: z.enum(['project', 'global', 'both']).default('project').describe('Which storage to check for outdated docs')
      })
    };
  }

  async execute(input: z.infer<typeof this.definition.inputSchema>) {
    const config = getStorageConfig();
    const storage = new DualDocStorage(input.workingDirectory, config);
    await storage.initialize();

    const maxAgeMs = input.maxAge * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const outdated: Array<{
      library: string;
      version: string;
      lastUpdated: string;
      age: string;
      url?: string;
      storage: 'project' | 'global';
    }> = [];
    const updated: string[] = [];
    const errors: string[] = [];

    try {
      // Check project storage
      if (input.storage === 'project' || input.storage === 'both') {
        const projectOutdated = await this.checkStorage(
          storage.project, 
          now, 
          maxAgeMs, 
          'project',
          input.library
        );
        outdated.push(...projectOutdated);
      }

      // Check global storage
      if (input.storage === 'global' || input.storage === 'both') {
        const globalOutdated = await this.checkStorage(
          storage.global, 
          now, 
          maxAgeMs, 
          'global',
          input.library
        );
        outdated.push(...globalOutdated);
      }

      // Auto-update if requested
      if (input.autoUpdate && outdated.length > 0) {
        const scraper = new WebScraper();
        
        for (const item of outdated) {
          if (item.url) {
            try {
              const targetStorage = item.storage === 'project' ? storage.project : storage.global;
              const doc = await targetStorage.getDocument(item.library, item.version);
              
              if (doc) {
                // Re-scrape the documentation
                const { content, metadata } = await scraper.scrapeUrl(item.url);
                
                // Update the document
                doc.content = content;
                doc.metadata = { ...doc.metadata, ...metadata };
                doc.updatedAt = new Date().toISOString();
                await targetStorage.saveDocument(doc);
                
                updated.push(`${item.library}@${item.version} (${item.storage})`);
              }
            } catch (error) {
              errors.push(`Failed to update ${item.library}@${item.version}: ${error}`);
            }
          }
        }
      }

      return {
        success: true,
        outdated: outdated.map(item => ({
          ...item,
          needsUpdate: `Last updated ${item.age} ago`
        })),
        updated: updated.length > 0 ? updated : undefined,
        errors: errors.length > 0 ? errors : undefined,
        message: outdated.length === 0 
          ? 'All documentation is up to date'
          : `Found ${outdated.length} outdated document(s)${updated.length > 0 ? `, updated ${updated.length}` : ''}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to check for outdated docs: ${error instanceof Error ? error.message : String(error)}`,
        outdated: [],
        errors: errors
      };
    }
  }

  private async checkStorage(
    storage: DocumentStorage,
    now: number,
    maxAgeMs: number,
    storageType: 'project' | 'global',
    filterLibrary?: string
  ): Promise<Array<{
    library: string;
    version: string;
    lastUpdated: string;
    age: string;
    url?: string;
    storage: 'project' | 'global';
  }>> {
    const outdated = [];
    const libraries = await storage.getLibraries();
    const librariesToCheck = filterLibrary 
      ? libraries.filter(lib => lib.name === filterLibrary)
      : libraries;

    for (const library of librariesToCheck) {
      for (const version of library.versions) {
        const doc = await storage.getDocument(library.name, version);
        if (doc) {
          const lastUpdated = new Date(doc.updatedAt).getTime();
          const age = now - lastUpdated;
          
          if (age > maxAgeMs) {
            outdated.push({
              library: library.name,
              version: version,
              lastUpdated: doc.updatedAt,
              age: this.formatAge(age),
              url: doc.url,
              storage: storageType
            });
          }
        }
      }
    }

    return outdated;
  }

  private formatAge(ageMs: number): string {
    const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ageMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours}h` : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
}