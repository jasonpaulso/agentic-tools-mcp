import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PromptsStorage } from '../../storage/storage.js';
import { PromptArgument, PromptMessage } from '../../models/prompt.js';

export interface CreatePromptInput {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  category?: string;
  tags?: string[];
  template?: string;
  messages?: PromptMessage[];
  metadata?: Record<string, any>;
}

export function createCreatePromptTool(storage: PromptsStorage) {
  return {
    async handler(input: CreatePromptInput): Promise<CallToolResult> {
      const prompt = await storage.createPrompt({
        name: input.name,
        description: input.description,
        arguments: input.arguments || [],
        category: input.category,
        tags: input.tags,
        template: input.template,
        messages: input.messages,
        metadata: input.metadata,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Created prompt "${prompt.name}" with ID: ${prompt.id}`,
          },
        ],
      };
    },
  };
}