/**
 * File-based storage implementation for prompts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Prompt } from '../models/prompt.js';
import { PromptsStorage } from './storage.js';

export class FileStorage implements PromptsStorage {
  private promptsDir: string;

  constructor(private workingDirectory: string) {
    this.promptsDir = path.join(workingDirectory, '.agentic-tools-mcp', 'prompts');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.promptsDir, { recursive: true });
  }

  // Prompts
  async createPrompt(
    promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Prompt> {
    const prompt: Prompt = {
      ...promptData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const filePath = path.join(this.promptsDir, `${prompt.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(prompt, null, 2));

    return prompt;
  }

  async getPrompt(promptId: string): Promise<Prompt> {
    const filePath = path.join(this.promptsDir, `${promptId}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error(`Prompt not found: ${promptId}`);
      }
      throw error;
    }
  }

  async updatePrompt(
    promptId: string,
    updates: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Prompt> {
    const existingPrompt = await this.getPrompt(promptId);
    
    const updatedPrompt: Prompt = {
      ...existingPrompt,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const filePath = path.join(this.promptsDir, `${promptId}.json`);
    await fs.writeFile(filePath, JSON.stringify(updatedPrompt, null, 2));

    return updatedPrompt;
  }

  async deletePrompt(promptId: string): Promise<void> {
    const filePath = path.join(this.promptsDir, `${promptId}.json`);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error(`Prompt not found: ${promptId}`);
      }
      throw error;
    }
  }

  async listPrompts(category?: string): Promise<Prompt[]> {
    try {
      const files = await fs.readdir(this.promptsDir);
      const promptFiles = files.filter(f => f.endsWith('.json'));
      
      const prompts: Prompt[] = [];
      
      for (const file of promptFiles) {
        const filePath = path.join(this.promptsDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const prompt = JSON.parse(data);
        
        if (!category || prompt.category === category) {
          prompts.push(prompt);
        }
      }
      
      // Sort by name
      return prompts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async searchPrompts(query: string): Promise<Prompt[]> {
    const allPrompts = await this.listPrompts();
    const lowerQuery = query.toLowerCase();
    
    return allPrompts.filter(prompt => {
      const nameMatch = prompt.name.toLowerCase().includes(lowerQuery);
      const descriptionMatch = prompt.description.toLowerCase().includes(lowerQuery);
      const categoryMatch = prompt.category?.toLowerCase().includes(lowerQuery) || false;
      const tagMatch = prompt.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) || false;
      
      return nameMatch || descriptionMatch || categoryMatch || tagMatch;
    });
  }
}