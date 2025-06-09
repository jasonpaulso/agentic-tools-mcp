import { join } from 'path';
import { homedir } from 'os';
import { DualDocumentStorage, DocumentStorage, DocumentSearchResult } from './storage.js';
import { DocFileStorage } from './doc-file-storage.js';
import { Document } from '../models/index.js';
import { getGlobalStorageDirectory, StorageConfig } from '../../../utils/storage-config.js';
import { isVersionCompatible, findBestVersion } from '../utils/version-utils.js';

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
    
    // Check if running in Docker by looking for the /data mount
    const isDocker = process.env.PATH_MAPPING || process.platform === 'linux';
    const globalBaseDir = isDocker && process.env.PATH_MAPPING
      ? '/data/.agentic-tools-mcp'  // Use the mounted volume in Docker
      : join(homedir(), '.agentic-tools-mcp');  // Use home directory locally
    
    return {
      globalPath: join(globalBaseDir, 'global-docs'),
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
    // 1. Try exact version match in project storage first
    let projectDoc = await this.project.getDocument(library, version);
    if (projectDoc) {
      return projectDoc;
    }

    // 2. Try to find a compatible version in project storage
    const projectLibraries = await this.project.getLibraries();
    const projectLibrary = projectLibraries.find(lib => lib.name === library);
    
    if (projectLibrary && projectLibrary.versions.length > 0) {
      const bestVersion = findBestVersion(projectLibrary.versions, version);
      if (bestVersion) {
        projectDoc = await this.project.getDocument(library, bestVersion);
        if (projectDoc) {
          return projectDoc;
        }
      }
    }
    
    // 3. Try exact version match in global storage
    let globalDoc = await this.global.getDocument(library, version);
    if (globalDoc) {
      // Copy to project storage for offline access
      await this.copyToProjectStorage(globalDoc);
      return globalDoc;
    }

    // 4. Try to find a compatible version in global storage
    const globalLibraries = await this.global.getLibraries();
    const globalLibrary = globalLibraries.find(lib => lib.name === library);
    
    if (globalLibrary && globalLibrary.versions.length > 0) {
      const bestVersion = findBestVersion(globalLibrary.versions, version);
      if (bestVersion) {
        globalDoc = await this.global.getDocument(library, bestVersion);
        if (globalDoc) {
          // Copy to project storage for offline access
          await this.copyToProjectStorage(globalDoc);
          return globalDoc;
        }
      }
    }
    
    return null;
  }

  /**
   * Copy a document from global to project storage
   */
  private async copyToProjectStorage(doc: Document): Promise<void> {
    // Check if already exists in project storage
    const existing = await this.project.getDocument(doc.library, doc.version);
    if (!existing) {
      await this.project.saveDocument({
        ...doc,
        projectId: 'current' // Mark as project-specific copy
      });
    }
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