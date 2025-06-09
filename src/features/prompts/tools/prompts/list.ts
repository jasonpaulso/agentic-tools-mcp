import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PromptsStorage } from '../../storage/storage.js';

export interface ListPromptsInput {
  category?: string;
}

export function createListPromptsTool(storage: PromptsStorage) {
  return {
    async handler(input: ListPromptsInput = {}): Promise<CallToolResult> {
      const prompts = await storage.listPrompts(input.category);

      if (prompts.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: input.category
                ? `No prompts found in category "${input.category}".`
                : 'No prompts found.',
            },
          ],
        };
      }

      const groupedByCategory = prompts.reduce((acc, prompt) => {
        const category = prompt.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(prompt);
        return acc;
      }, {} as Record<string, typeof prompts>);

      let output = `## Prompts (${prompts.length} total)\n\n`;

      for (const [category, categoryPrompts] of Object.entries(groupedByCategory)) {
        output += `### ${category}\n\n`;
        for (const prompt of categoryPrompts) {
          output += `- **${prompt.name}** (ID: ${prompt.id})\n`;
          output += `  ${prompt.description}\n`;
          if (prompt.arguments.length > 0) {
            output += `  Arguments: ${prompt.arguments.map(arg => arg.name).join(', ')}\n`;
          }
          if (prompt.tags && prompt.tags.length > 0) {
            output += `  Tags: ${prompt.tags.join(', ')}\n`;
          }
          output += '\n';
        }
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