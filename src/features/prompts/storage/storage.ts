/**
 * Storage interface for prompts
 */

import { Prompt } from '../models/prompt.js';

export interface PromptsStorage {
  // Initialize storage
  initialize(): Promise<void>;

  // Prompts
  createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt>;
  getPrompt(promptId: string): Promise<Prompt>;
  updatePrompt(promptId: string, updates: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Prompt>;
  deletePrompt(promptId: string): Promise<void>;
  listPrompts(category?: string): Promise<Prompt[]>;
  searchPrompts(query: string): Promise<Prompt[]>;
}