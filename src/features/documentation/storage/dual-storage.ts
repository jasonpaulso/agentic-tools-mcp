import { join } from 'path';
import { homedir } from 'os';
import { DualDocumentStorage, DocumentStorage, DocumentSearchResult } from './storage.js';
import { DocFileStorage } from './doc-file-storage.js';
import { Document } from '../models/index.js';
import { getGlobalStorageDirectory, StorageConfig } from '../../../utils/storage-config.js';

/**
 * Dual storage implementation that manages both project and global documentation
 */
export class DualDocStorage implements DualDocumentStorage {
  public project: DocumentStorage;
  public global: DocumentStorage;

  constructor(workingDirectory: string, config: StorageConfig) {
    const { globalPath, projectPath } = this.resolveDocStoragePaths(workingDirectory, config);
    
    this.global = new DocFileStorage(globalPath);
    this.project = new DocFileStorage(projectPath);
  }

  /**
   * Resolve storage paths based on configuration
   */
  private resolveDocStoragePaths(workingDirectory: string, config: StorageConfig): { globalPath: string; projectPath: string } {
    if (config.useGlobalDirectory) {
      const globalDir = getGlobalStorageDirectory();
      return {
        globalPath: join(globalDir, 'global-docs'),
        projectPath: join(globalDir, 'docs')
      };
    }
    
    return {
      globalPath: join(homedir(), '.agentic-tools-mcp', 'global-docs'),
      projectPath: join(workingDirectory, '.agentic-tools-mcp', 'docs')
    };
  }

  /**
   * Initialize both storages
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.global.initialize(),
      this.project.initialize()
    ]);
  }

  /**
   * Get document with fallback from project to global storage
   */
  async getDocument(library: string, version: string): Promise<Document | null> {
    // 1. Check project storage first
    const projectDoc = await this.project.getDocument(library, version);
    if (projectDoc && this.isVersionCompatible(projectDoc.version, version)) {
      return projectDoc;
    }
    
    // 2. Check global storage
    const globalDoc = await this.global.getDocument(library, version);
    if (globalDoc) {
      // Copy to project storage for offline access
      await this.project.saveDocument({
        ...globalDoc,
        id: globalDoc.id + '_project', // Ensure unique ID in project storage
        projectId: 'current' // Mark as project-specific copy
      });
      return globalDoc;
    }
    
    return null;
  }

  /**
   * Search across both storages
   */
  async searchDocuments(query: string, limit: number = 10): Promise<DocumentSearchResult[]> {
    const [projectResults, globalResults] = await Promise.all([
      this.project.searchDocuments(query, limit),
      this.global.searchDocuments(query, limit)
    ]);

    // Merge results, prioritizing project results
    const merged = [...projectResults];
    const projectIds = new Set(projectResults.map(r => r.document.id));

    for (const globalResult of globalResults) {
      // Skip if we already have this document from project storage
      if (!projectIds.has(globalResult.document.id)) {
        merged.push({
          ...globalResult,
          score: globalResult.score * 0.9 // Slightly lower score for global results
        });
      }
    }

    // Sort by score and apply limit
    merged.sort((a, b) => b.score - a.score);
    return merged.slice(0, limit);
  }

  /**
   * Check if a stored version is compatible with the requested version
   */
  private isVersionCompatible(stored: string, requested: string): boolean {
    // Simple exact match for now
    // TODO: Implement semver-like comparison
    return stored === requested || requested === 'latest';
  }

  /**
   * Sync project documentation with global cache
   */
  async syncWithGlobal(): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const projectLibraries = await this.project.getLibraries();
      
      for (const library of projectLibraries) {
        for (const version of library.versions) {
          const projectDoc = await this.project.getDocument(library.name, version);
          if (projectDoc) {
            try {
              await this.global.saveDocument(projectDoc);
              synced++;
            } catch (error) {
              errors++;
            }
          }
        }
      }
    } catch (error) {
      errors++;
    }

    return { synced, errors };
  }

  /**
   * Update outdated documentation
   */
  async updateOutdated(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<string[]> {
    const updated: string[] = [];
    const now = Date.now();

    const libraries = await this.project.getLibraries();
    
    for (const library of libraries) {
      const lastScraped = new Date(library.lastScraped).getTime();
      
      if (now - lastScraped > maxAge) {
        updated.push(`${library.name} (last updated: ${library.lastScraped})`);
      }
    }

    return updated;
  }
}