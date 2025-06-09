import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PromptsStorage } from '../../storage/storage.js';

export interface DeletePromptInput {
  id: string;
  confirm: boolean;
}

export function createDeletePromptTool(storage: PromptsStorage) {
  return {
    async handler(input: DeletePromptInput): Promise<CallToolResult> {
      if (!input.confirm) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Deletion cancelled. Set confirm to true to delete the prompt.',
            },
          ],
        };
      }

      await storage.deletePrompt(input.id);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Prompt deleted successfully (ID: ${input.id})`,
          },
        ],
      };
    },
  };
}