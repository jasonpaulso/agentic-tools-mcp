import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PromptsStorage } from '../../storage/storage.js';
import { PromptArgument, PromptMessage } from '../../models/prompt.js';

export interface UpdatePromptInput {
  id: string;
  name?: string;
  description?: string;
  arguments?: PromptArgument[];
  category?: string;
  tags?: string[];
  template?: string;
  messages?: PromptMessage[];
  metadata?: Record<string, any>;
}

export function createUpdatePromptTool(storage: PromptsStorage) {
  return {
    async handler(input: UpdatePromptInput): Promise<CallToolResult> {
      const { id, ...updates } = input;
      
      const updatedPrompt = await storage.updatePrompt(id, updates);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Updated prompt "${updatedPrompt.name}" (ID: ${updatedPrompt.id})`,
          },
        ],
      };
    },
  };
}