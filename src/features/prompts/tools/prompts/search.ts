import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PromptsStorage } from '../../storage/storage.js';

export interface SearchPromptsInput {
  query: string;
}

export function createSearchPromptsTool(storage: PromptsStorage) {
  return {
    async handler(input: SearchPromptsInput): Promise<CallToolResult> {
      const prompts = await storage.searchPrompts(input.query);

      if (prompts.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No prompts found matching "${input.query}".`,
            },
          ],
        };
      }

      let output = `## Search Results for "${input.query}" (${prompts.length} found)\n\n`;

      for (const prompt of prompts) {
        output += `### ${prompt.name} (ID: ${prompt.id})\n`;
        output += `${prompt.description}\n`;
        
        if (prompt.category) {
          output += `**Category:** ${prompt.category}\n`;
        }
        
        if (prompt.tags && prompt.tags.length > 0) {
          output += `**Tags:** ${prompt.tags.join(', ')}\n`;
        }
        
        if (prompt.arguments.length > 0) {
          output += `**Arguments:** ${prompt.arguments.map(arg => arg.name).join(', ')}\n`;
        }
        
        output += '\n';
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: output.trim(),
          },
        ],
      };
    },
  };
}