import { MemorySearchResult } from '../agent-memories/models/memory.js';
import { DocumentSearchResult } from '../documentation/models/index.js';
import { Task } from '../task-management/models/task.js';
import { MemoryStorage } from '../agent-memories/storage/storage.js';
import { DualDocumentStorage } from '../documentation/storage/storage.js';
import { TaskStorage } from '../task-management/storage/storage.js';

export interface UnifiedSearchResult {
  type: 'memory' | 'task' | 'document';
  score: number;
  data: MemorySearchResult | Task | DocumentSearchResult;
  highlights?: string[];
}

export interface UnifiedSearchOptions {
  includeMemories?: boolean;
  includeTasks?: boolean;
  includeDocuments?: boolean;
  limit?: number;
  minScore?: number;
}

export class UnifiedSearchEngine {
  constructor(
    private memoryStorage: MemoryStorage,
    private taskStorage: TaskStorage,
    private documentStorage: DualDocumentStorage
  ) {}

  /**
   * Search across all content types
   */
  async search(query: string, options: UnifiedSearchOptions = {}): Promise<UnifiedSearchResult[]> {
    const {
      includeMemories = true,
      includeTasks = true,
      includeDocuments = true,
      limit = 20,
      minScore = 0.1
    } = options;

    const searchPromises: Promise<UnifiedSearchResult[]>[] = [];

    // Search memories
    if (includeMemories) {
      searchPromises.push(this.searchMemories(query));
    }

    // Search tasks
    if (includeTasks) {
      searchPromises.push(this.searchTasks(query));
    }

    // Search documents
    if (includeDocuments) {
      searchPromises.push(this.searchDocuments(query));
    }

    // Execute all searches in parallel
    const results = await Promise.all(searchPromises);
    const allResults = results.flat();

    // Filter by minimum score
    const filteredResults = allResults.filter(result => result.score >= minScore);

    // Sort by score descending
    filteredResults.sort((a, b) => b.score - a.score);

    // Apply limit
    return filteredResults.slice(0, limit);
  }

  /**
   * Search memories
   */
  private async searchMemories(query: string): Promise<UnifiedSearchResult[]> {
    try {
      const results = await this.memoryStorage.searchMemories({
        query,
        limit: 50,
        threshold: 0.1
      });

      return results.map(result => ({
        type: 'memory' as const,
        score: result.score,
        data: result,
        highlights: [result.memory.content.substring(0, 200) + '...']
      }));
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }

  /**
   * Search tasks
   */
  private async searchTasks(query: string): Promise<UnifiedSearchResult[]> {
    try {
      const queryLower = query.toLowerCase();
      const allTasks = await this.taskStorage.getTasks();

      const results: UnifiedSearchResult[] = [];

      for (const task of allTasks) {
        let score = 0;
        const highlights: string[] = [];

        // Search in task name
        if (task.name.toLowerCase().includes(queryLower)) {
          score += 0.4;
          highlights.push(`Task: ${task.name}`);
        }

        // Search in task details
        if (task.details.toLowerCase().includes(queryLower)) {
          score += 0.3;
          const index = task.details.toLowerCase().indexOf(queryLower);
          const start = Math.max(0, index - 50);
          const end = Math.min(task.details.length, index + queryLower.length + 50);
          highlights.push('...' + task.details.substring(start, end) + '...');
        }

        // Search in tags
        if (task.tags) {
          for (const tag of task.tags) {
            if (tag.toLowerCase().includes(queryLower)) {
              score += 0.2;
              highlights.push(`Tag: ${tag}`);
            }
          }
        }

        // Boost score for status relevance
        if (task.status === 'in-progress') {
          score *= 1.2;
        } else if (task.status === 'pending') {
          score *= 1.1;
        }

        if (score > 0) {
          results.push({
            type: 'task',
            score: Math.min(1, score),
            data: task,
            highlights
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  /**
   * Search documents
   */
  private async searchDocuments(query: string): Promise<UnifiedSearchResult[]> {
    try {
      const results = await this.documentStorage.searchDocuments(query, 50);

      return results.map(result => ({
        type: 'document' as const,
        score: result.score,
        data: result,
        highlights: result.highlights
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  /**
   * Get contextual results based on a specific item
   */
  async getRelatedContent(
    itemType: 'memory' | 'task' | 'document',
    itemId: string,
    limit: number = 10
  ): Promise<UnifiedSearchResult[]> {
    let keywords: string[] = [];

    // Extract keywords based on item type
    switch (itemType) {
      case 'memory': {
        const memory = await this.memoryStorage.getMemory(itemId);
        if (memory) {
          keywords = this.extractKeywords(memory.title + ' ' + memory.content);
        }
        break;
      }
      case 'task': {
        const task = await this.taskStorage.getTask(itemId);
        if (task) {
          keywords = this.extractKeywords(task.name + ' ' + task.details);
          if (task.tags) {
            keywords.push(...task.tags);
          }
        }
        break;
      }
      case 'document': {
        // Document retrieval would need to be implemented in DocumentStorage
        // For now, we'll skip this
        break;
      }
    }

    if (keywords.length === 0) {
      return [];
    }

    // Search with extracted keywords
    const query = keywords.slice(0, 5).join(' ');
    return this.search(query, { limit });
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Sort by frequency and return top words
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are',
      'been', 'by', 'for', 'from', 'has', 'have', 'in', 'of', 'that',
      'this', 'to', 'was', 'will', 'with', 'be', 'can', 'could', 'do',
      'does', 'did', 'doing', 'done', 'should', 'would', 'could', 'may',
      'might', 'must', 'shall', 'will', 'about', 'above', 'after', 'again',
      'all', 'also', 'am', 'an', 'any', 'are', 'as', 'at', 'be', 'because',
      'been', 'being', 'but', 'by', 'can', 'did', 'do', 'does', 'doing',
      'each', 'few', 'for', 'from', 'had', 'has', 'have', 'having', 'he',
      'her', 'here', 'him', 'his', 'how', 'i', 'if', 'in', 'into', 'is',
      'it', 'its', 'just', 'me', 'more', 'most', 'my', 'no', 'not', 'now',
      'of', 'on', 'once', 'only', 'or', 'other', 'our', 'out', 'over',
      'own', 'same', 'she', 'so', 'some', 'such', 'than', 'that', 'the',
      'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
      'through', 'to', 'too', 'under', 'up', 'very', 'was', 'we', 'were',
      'what', 'when', 'where', 'which', 'while', 'who', 'why', 'with',
      'would', 'you', 'your'
    ]);

    return stopWords.has(word);
  }
}