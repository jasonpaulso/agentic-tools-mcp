import { Document, Library } from '../models/index.js';

/**
 * Storage interface for documentation
 */
export interface DocumentStorage {
  initialize(): Promise<void>;
  
  // Document operations
  saveDocument(doc: Document): Promise<Document>;
  getDocument(library: string, version: string): Promise<Document | null>;
  getDocumentById(id: string): Promise<Document | null>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | null>;
  deleteDocument(id: string): Promise<boolean>;
  searchDocuments(query: string, limit?: number): Promise<DocumentSearchResult[]>;
  
  // Library operations
  getLibrary(name: string): Promise<Library | null>;
  getLibraries(): Promise<Library[]>;
  updateLibrary(name: string, updates: Partial<Library>): Promise<Library | null>;
  deleteLibrary(name: string): Promise<boolean>;
  
  // Statistics
  getStatistics(): Promise<DocumentStorageStats>;
}

export interface DocumentSearchResult {
  document: Document;
  score: number;
  highlights?: string[];
}

export interface DocumentStorageStats {
  totalDocuments: number;
  totalLibraries: number;
  documentsByLibrary: Record<string, number>;
  storageSize?: number;
}

/**
 * Dual storage interface for project and global documentation
 */
export interface DualDocumentStorage {
  project: DocumentStorage;
  global: DocumentStorage;
  
  // Unified operations that check both storages
  getDocument(library: string, version: string): Promise<Document | null>;
  searchDocuments(query: string, limit?: number): Promise<DocumentSearchResult[]>;
}