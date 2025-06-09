import { Document, DocumentSearchResult } from '../models/index.js';

export interface SearchOptions {
  limit?: number;
  includeHighlights?: boolean;
  highlightLength?: number;
  minScore?: number;
}

export interface SearchWeights {
  title: number;
  description: number;
  library: number;
  content: number;
  headers: number;
  codeBlocks: number;
  apiReferences: number;
}

const DEFAULT_WEIGHTS: SearchWeights = {
  title: 0.3,
  description: 0.15,
  library: 0.15,
  content: 0.1,
  headers: 0.15,
  codeBlocks: 0.1,
  apiReferences: 0.05
};

export class DocumentSearchEngine {
  constructor(private weights: SearchWeights = DEFAULT_WEIGHTS) {}

  /**
   * Enhanced search with documentation-specific ranking
   */
  search(documents: Document[], query: string, options: SearchOptions = {}): DocumentSearchResult[] {
    const {
      limit = 10,
      includeHighlights = true,
      highlightLength = 100,
      minScore = 0.1
    } = options;

    const queryLower = query.toLowerCase();
    const queryTerms = this.tokenize(queryLower);
    const results: DocumentSearchResult[] = [];

    for (const doc of documents) {
      const score = this.calculateScore(doc, queryLower, queryTerms);
      
      if (score >= minScore) {
        const highlights = includeHighlights 
          ? this.extractHighlights(doc, queryLower, highlightLength)
          : [];

        results.push({
          document: doc,
          score,
          highlights
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }

  /**
   * Calculate relevance score for a document
   */
  private calculateScore(doc: Document, queryLower: string, queryTerms: string[]): number {
    let score = 0;

    // Title matching
    if (doc.metadata.title) {
      const titleLower = doc.metadata.title.toLowerCase();
      if (titleLower.includes(queryLower)) {
        score += this.weights.title * 2; // Exact match bonus
      } else {
        const titleScore = this.calculateTermScore(titleLower, queryTerms);
        score += this.weights.title * titleScore;
      }
    }

    // Description matching
    if (doc.metadata.description) {
      const descLower = doc.metadata.description.toLowerCase();
      if (descLower.includes(queryLower)) {
        score += this.weights.description * 1.5;
      } else {
        const descScore = this.calculateTermScore(descLower, queryTerms);
        score += this.weights.description * descScore;
      }
    }

    // Library name matching
    const libraryLower = doc.library.toLowerCase();
    if (libraryLower.includes(queryLower)) {
      score += this.weights.library * 2;
    } else {
      const libScore = this.calculateTermScore(libraryLower, queryTerms);
      score += this.weights.library * libScore;
    }

    // Content analysis
    const contentLower = doc.content.toLowerCase();
    
    // Headers (markdown # lines)
    const headers = this.extractHeaders(doc.content);
    const headerScore = this.calculateHeaderScore(headers, queryLower, queryTerms);
    score += this.weights.headers * headerScore;

    // Code blocks
    const codeBlocks = this.extractCodeBlocks(doc.content);
    const codeScore = this.calculateCodeScore(codeBlocks, queryLower, queryTerms);
    score += this.weights.codeBlocks * codeScore;

    // API references (function names, method calls)
    const apiRefs = this.extractApiReferences(doc.content);
    const apiScore = this.calculateApiScore(apiRefs, queryLower, queryTerms);
    score += this.weights.apiReferences * apiScore;

    // General content matching
    if (contentLower.includes(queryLower)) {
      score += this.weights.content;
    } else {
      const contentScore = this.calculateTermScore(contentLower, queryTerms);
      score += this.weights.content * contentScore;
    }

    return Math.min(1, score); // Cap at 1.0
  }

  /**
   * Tokenize query into terms
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(term => term.length > 2)
      .map(term => term.replace(/[^a-z0-9]/g, ''));
  }

  /**
   * Calculate score based on term matches
   */
  private calculateTermScore(text: string, terms: string[]): number {
    if (terms.length === 0) return 0;
    
    let matchCount = 0;
    for (const term of terms) {
      if (text.includes(term)) {
        matchCount++;
      }
    }
    
    return matchCount / terms.length;
  }

  /**
   * Extract headers from markdown content
   */
  private extractHeaders(content: string): string[] {
    const headerRegex = /^#{1,6}\s+(.+)$/gm;
    const headers: string[] = [];
    let match;
    
    while ((match = headerRegex.exec(content)) !== null) {
      headers.push(match[1]);
    }
    
    return headers;
  }

  /**
   * Calculate header matching score
   */
  private calculateHeaderScore(headers: string[], queryLower: string, queryTerms: string[]): number {
    if (headers.length === 0) return 0;
    
    let totalScore = 0;
    for (const header of headers) {
      const headerLower = header.toLowerCase();
      if (headerLower.includes(queryLower)) {
        totalScore += 1;
      } else {
        totalScore += this.calculateTermScore(headerLower, queryTerms) * 0.5;
      }
    }
    
    return Math.min(1, totalScore / headers.length);
  }

  /**
   * Extract code blocks from markdown
   */
  private extractCodeBlocks(content: string): string[] {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const blocks: string[] = [];
    
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push(match[0]);
    }
    
    while ((match = inlineCodeRegex.exec(content)) !== null) {
      blocks.push(match[1]);
    }
    
    return blocks;
  }

  /**
   * Calculate code block matching score
   */
  private calculateCodeScore(codeBlocks: string[], queryLower: string, queryTerms: string[]): number {
    if (codeBlocks.length === 0) return 0;
    
    let matchCount = 0;
    for (const block of codeBlocks) {
      const blockLower = block.toLowerCase();
      if (blockLower.includes(queryLower)) {
        matchCount++;
      }
    }
    
    return matchCount / codeBlocks.length;
  }

  /**
   * Extract API references (function names, methods)
   */
  private extractApiReferences(content: string): string[] {
    const apiPatterns = [
      /\b(\w+)\s*\(/g,              // function calls
      /\.(\w+)\s*\(/g,              // method calls
      /\b(?:function|method|api)\s+(\w+)/gi,  // function/method definitions
      /\b(\w+):\s*function/g,       // object methods
    ];
    
    const refs = new Set<string>();
    
    for (const pattern of apiPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        refs.add(match[1]);
      }
    }
    
    return Array.from(refs);
  }

  /**
   * Calculate API reference matching score
   */
  private calculateApiScore(apiRefs: string[], queryLower: string, queryTerms: string[]): number {
    if (apiRefs.length === 0) return 0;
    
    let matchCount = 0;
    for (const ref of apiRefs) {
      const refLower = ref.toLowerCase();
      if (refLower.includes(queryLower) || queryLower.includes(refLower)) {
        matchCount++;
      }
    }
    
    return Math.min(1, matchCount / Math.max(1, apiRefs.length / 10));
  }

  /**
   * Extract highlights from document
   */
  private extractHighlights(doc: Document, queryLower: string, maxLength: number): string[] {
    const highlights: string[] = [];
    const content = doc.content;
    const contentLower = content.toLowerCase();
    
    // Find all occurrences
    let index = contentLower.indexOf(queryLower);
    while (index !== -1 && highlights.length < 3) {
      const start = Math.max(0, index - maxLength / 2);
      const end = Math.min(content.length, index + queryLower.length + maxLength / 2);
      
      let highlight = content.substring(start, end);
      
      // Add ellipsis if needed
      if (start > 0) highlight = '...' + highlight;
      if (end < content.length) highlight = highlight + '...';
      
      // Highlight the matched text
      const matchStart = start > 0 ? index - start + 3 : index - start;
      const matchEnd = matchStart + queryLower.length;
      
      highlights.push(highlight);
      
      // Find next occurrence
      index = contentLower.indexOf(queryLower, index + 1);
    }
    
    // If no exact matches, try to find partial matches in headers or code
    if (highlights.length === 0) {
      const headers = this.extractHeaders(content);
      for (const header of headers) {
        if (header.toLowerCase().includes(queryLower)) {
          highlights.push(`### ${header}`);
          break;
        }
      }
    }
    
    return highlights;
  }
}