import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { DocumentStorage, DocumentSearchResult, DocumentStorageStats } from './storage.js';
import { Document, Library } from '../models/index.js';

/**
 * File-based storage implementation for documentation
 * Stores documents as JSON files organized by library and version
 */
export class DocFileStorage implements DocumentStorage {
  private basePath: string;
  private docsDir: string;
  private librariesDir: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.docsDir = join(basePath, 'documents');
    this.librariesDir = join(basePath, 'libraries');
  }

  /**
   * Initialize the file storage system
   */
  async initialize(): Promise<void> {
    try {
      // Ensure base directory exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      // Ensure documents directory exists
      await fs.mkdir(this.docsDir, { recursive: true });
      
      // Ensure libraries directory exists
      await fs.mkdir(this.librariesDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize documentation storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sanitize a string for safe filesystem usage
   */
  private sanitizeFileName(input: string): string {
    return input
      .replace(/[/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 100) || 'doc';
  }

  /**
   * Get file path for a document
   */
  private getDocumentPath(library: string, version: string): string {
    const safeLibrary = this.sanitizeFileName(library);
    const safeVersion = this.sanitizeFileName(version);
    return join(this.docsDir, safeLibrary, `${safeVersion}.json`);
  }

  /**
   * Get file path for a library
   */
  private getLibraryPath(name: string): string {
    const safeName = this.sanitizeFileName(name);
    return join(this.librariesDir, `${safeName}.json`);
  }

  /**
   * Find document file by ID
   */
  private async findDocumentFileById(id: string): Promise<string | null> {
    try {
      const libraries = await fs.readdir(this.docsDir, { withFileTypes: true });

      for (const library of libraries) {
        if (library.isDirectory()) {
          const libraryPath = join(this.docsDir, library.name);
          const files = await fs.readdir(libraryPath);

          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = join(libraryPath, file);
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                const doc = JSON.parse(content);
                if (doc.id === id) {
                  return filePath;
                }
              } catch (error) {
                continue;
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save a document
   */
  async saveDocument(doc: Document): Promise<Document> {
    const docPath = this.getDocumentPath(doc.library, doc.version);
    
    // Ensure library directory exists
    await fs.mkdir(dirname(docPath), { recursive: true });
    
    // Save document
    await fs.writeFile(docPath, JSON.stringify(doc, null, 2), 'utf-8');
    
    // Update library info
    await this.updateLibraryInfo(doc.library, doc.version);
    
    return doc;
  }

  /**
   * Update library information
   */
  private async updateLibraryInfo(name: string, version: string): Promise<void> {
    const library = await this.getLibrary(name) || {
      name,
      versions: [],
      source: 'unknown',
      lastScraped: new Date().toISOString(),
      projectSpecific: true
    };

    if (!library.versions.includes(version)) {
      library.versions.push(version);
    }
    library.lastScraped = new Date().toISOString();

    const libraryPath = this.getLibraryPath(name);
    await fs.mkdir(dirname(libraryPath), { recursive: true });
    await fs.writeFile(libraryPath, JSON.stringify(library, null, 2), 'utf-8');
  }

  /**
   * Get a document by library and version
   */
  async getDocument(library: string, version: string): Promise<Document | null> {
    const docPath = this.getDocumentPath(library, version);
    
    try {
      const content = await fs.readFile(docPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get a document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    const filePath = await this.findDocumentFileById(id);
    if (!filePath) {
      return null;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update a document
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
    const filePath = await this.findDocumentFileById(id);
    if (!filePath) {
      return null;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const existingDoc = JSON.parse(content);

      const updatedDoc: Document = {
        ...existingDoc,
        ...updates,
        id: existingDoc.id,
        updatedAt: new Date().toISOString()
      };

      // If library or version changed, move the file
      if ((updates.library && updates.library !== existingDoc.library) ||
          (updates.version && updates.version !== existingDoc.version)) {
        await fs.unlink(filePath);
        await this.saveDocument(updatedDoc);
      } else {
        await fs.writeFile(filePath, JSON.stringify(updatedDoc, null, 2), 'utf-8');
      }

      return updatedDoc;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<boolean> {
    const filePath = await this.findDocumentFileById(id);
    if (!filePath) {
      return false;
    }

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(query: string, limit: number = 10): Promise<DocumentSearchResult[]> {
    const results: DocumentSearchResult[] = [];
    const queryLower = query.toLowerCase();

    try {
      const libraries = await fs.readdir(this.docsDir, { withFileTypes: true });

      for (const library of libraries) {
        if (library.isDirectory()) {
          const libraryPath = join(this.docsDir, library.name);
          const files = await fs.readdir(libraryPath);

          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = join(libraryPath, file);
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                const doc: Document = JSON.parse(content);

                // Search in various fields
                const titleMatch = doc.metadata.title?.toLowerCase().includes(queryLower) || false;
                const descMatch = doc.metadata.description?.toLowerCase().includes(queryLower) || false;
                const contentMatch = doc.content.toLowerCase().includes(queryLower);
                const libraryMatch = doc.library.toLowerCase().includes(queryLower);
                const urlMatch = doc.url.toLowerCase().includes(queryLower);

                if (titleMatch || descMatch || contentMatch || libraryMatch || urlMatch) {
                  // Calculate relevance score
                  let score = 0;
                  if (titleMatch) score += 0.4;
                  if (descMatch) score += 0.2;
                  if (libraryMatch) score += 0.2;
                  if (contentMatch) score += 0.2;

                  // Extract highlights
                  const highlights: string[] = [];
                  if (contentMatch) {
                    const index = doc.content.toLowerCase().indexOf(queryLower);
                    const start = Math.max(0, index - 50);
                    const end = Math.min(doc.content.length, index + queryLower.length + 50);
                    highlights.push('...' + doc.content.substring(start, end) + '...');
                  }

                  results.push({
                    document: doc,
                    score,
                    highlights
                  });
                }
              } catch (error) {
                continue;
              }
            }
          }
        }
      }

      // Sort by score and apply limit
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get library information
   */
  async getLibrary(name: string): Promise<Library | null> {
    const libraryPath = this.getLibraryPath(name);
    
    try {
      const content = await fs.readFile(libraryPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all libraries
   */
  async getLibraries(): Promise<Library[]> {
    const libraries: Library[] = [];

    try {
      const files = await fs.readdir(this.librariesDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = join(this.librariesDir, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            libraries.push(JSON.parse(content));
          } catch (error) {
            continue;
          }
        }
      }

      return libraries;
    } catch (error) {
      return [];
    }
  }

  /**
   * Update library information
   */
  async updateLibrary(name: string, updates: Partial<Library>): Promise<Library | null> {
    const library = await this.getLibrary(name);
    if (!library) {
      return null;
    }

    const updatedLibrary: Library = {
      ...library,
      ...updates,
      name: library.name // Ensure name doesn't change
    };

    const libraryPath = this.getLibraryPath(name);
    await fs.writeFile(libraryPath, JSON.stringify(updatedLibrary, null, 2), 'utf-8');

    return updatedLibrary;
  }

  /**
   * Delete a library and all its documents
   */
  async deleteLibrary(name: string): Promise<boolean> {
    try {
      // Delete library metadata
      const libraryPath = this.getLibraryPath(name);
      await fs.unlink(libraryPath).catch(() => {});

      // Delete all documents for this library
      const docsPath = join(this.docsDir, this.sanitizeFileName(name));
      await fs.rm(docsPath, { recursive: true, force: true }).catch(() => {});

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStatistics(): Promise<DocumentStorageStats> {
    const stats: DocumentStorageStats = {
      totalDocuments: 0,
      totalLibraries: 0,
      documentsByLibrary: {}
    };

    try {
      // Count libraries
      const libraries = await this.getLibraries();
      stats.totalLibraries = libraries.length;

      // Count documents
      const libraryDirs = await fs.readdir(this.docsDir, { withFileTypes: true });
      
      for (const library of libraryDirs) {
        if (library.isDirectory()) {
          const libraryPath = join(this.docsDir, library.name);
          const files = await fs.readdir(libraryPath);
          const docCount = files.filter(f => f.endsWith('.json')).length;
          
          stats.documentsByLibrary[library.name] = docCount;
          stats.totalDocuments += docCount;
        }
      }

      return stats;
    } catch (error) {
      return stats;
    }
  }
}