import { z } from 'zod';
import { DualDocStorage } from '../../storage/dual-storage.js';
import { getStorageConfig } from '../../../../utils/storage-config.js';

export class SyncDocsTool {
  get definition() {
    return {
      name: 'sync_docs',
      description: 'Synchronize project documentation with global cache for sharing across projects',
      inputSchema: z.object({
        workingDirectory: z.string().describe('The full absolute path to the working directory'),
        direction: z.enum(['to-global', 'from-global', 'bidirectional']).default('to-global').describe('Sync direction: to-global (project→global), from-global (global→project), or bidirectional'),
        library: z.string().optional().describe('Specific library to sync (if not provided, syncs all)'),
        version: z.string().optional().describe('Specific version to sync (requires library parameter)')
      })
    };
  }

  async execute(input: z.infer<typeof this.definition.inputSchema>) {
    const config = getStorageConfig();
    const storage = new DualDocStorage(input.workingDirectory, config);
    await storage.initialize();

    const results = {
      synced: 0,
      errors: 0,
      details: [] as string[]
    };

    try {
      if (input.direction === 'to-global' || input.direction === 'bidirectional') {
        // Sync from project to global
        const projectResult = await this.syncToGlobal(storage, input.library, input.version);
        results.synced += projectResult.synced;
        results.errors += projectResult.errors;
        results.details.push(...projectResult.details);
      }

      if (input.direction === 'from-global' || input.direction === 'bidirectional') {
        // Sync from global to project
        const globalResult = await this.syncFromGlobal(storage, input.library, input.version);
        results.synced += globalResult.synced;
        results.errors += globalResult.errors;
        results.details.push(...globalResult.details);
      }

      return {
        success: results.errors === 0,
        synced: results.synced,
        errors: results.errors,
        message: `Synchronized ${results.synced} document(s) with ${results.errors} error(s)`,
        details: results.details
      };
    } catch (error) {
      return {
        success: false,
        synced: results.synced,
        errors: results.errors + 1,
        message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
        details: results.details
      };
    }
  }

  private async syncToGlobal(
    storage: DualDocStorage, 
    library?: string, 
    version?: string
  ): Promise<{ synced: number; errors: number; details: string[] }> {
    const results = { synced: 0, errors: 0, details: [] as string[] };
    
    try {
      const projectLibraries = await storage.project.getLibraries();
      const librariesToSync = library 
        ? projectLibraries.filter(lib => lib.name === library)
        : projectLibraries;

      for (const lib of librariesToSync) {
        const versionsToSync = version && library ? [version] : lib.versions;
        
        for (const ver of versionsToSync) {
          try {
            const doc = await storage.project.getDocument(lib.name, ver);
            if (doc) {
              // Check if global has this version
              const globalDoc = await storage.global.getDocument(lib.name, ver);
              
              if (!globalDoc || new Date(doc.updatedAt) > new Date(globalDoc.updatedAt)) {
                await storage.global.saveDocument(doc);
                results.synced++;
                results.details.push(`↑ ${lib.name}@${ver} → global`);
              }
            }
          } catch (error) {
            results.errors++;
            results.details.push(`✗ Failed to sync ${lib.name}@${ver}: ${error}`);
          }
        }
      }
    } catch (error) {
      results.errors++;
      results.details.push(`✗ Error accessing project storage: ${error}`);
    }

    return results;
  }

  private async syncFromGlobal(
    storage: DualDocStorage, 
    library?: string, 
    version?: string
  ): Promise<{ synced: number; errors: number; details: string[] }> {
    const results = { synced: 0, errors: 0, details: [] as string[] };
    
    try {
      const globalLibraries = await storage.global.getLibraries();
      const librariesToSync = library 
        ? globalLibraries.filter(lib => lib.name === library)
        : globalLibraries;

      for (const lib of librariesToSync) {
        const versionsToSync = version && library ? [version] : lib.versions;
        
        for (const ver of versionsToSync) {
          try {
            const doc = await storage.global.getDocument(lib.name, ver);
            if (doc) {
              // Check if project has this version
              const projectDoc = await storage.project.getDocument(lib.name, ver);
              
              if (!projectDoc || new Date(doc.updatedAt) > new Date(projectDoc.updatedAt)) {
                await storage.project.saveDocument({
                  ...doc,
                  projectId: 'current'
                });
                results.synced++;
                results.details.push(`↓ ${lib.name}@${ver} ← global`);
              }
            }
          } catch (error) {
            results.errors++;
            results.details.push(`✗ Failed to sync ${lib.name}@${ver}: ${error}`);
          }
        }
      }
    } catch (error) {
      results.errors++;
      results.details.push(`✗ Error accessing global storage: ${error}`);
    }

    return results;
  }
}