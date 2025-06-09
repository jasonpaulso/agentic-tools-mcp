import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PromptsStorage } from '../../storage/storage.js';

export interface GetPromptInput {
  id: string;
}

export function createGetPromptTool(storage: PromptsStorage) {
  return {
    async handler(input: GetPromptInput): Promise<CallToolResult> {
      const prompt = await storage.getPrompt(input.id);

      let output = `## ${prompt.name}\n\n`;
      output += `**ID:** ${prompt.id}\n`;
      output += `**Description:** ${prompt.description}\n`;
      
      if (prompt.category) {
        output += `**Category:** ${prompt.category}\n`;
      }
      
      if (prompt.tags && prompt.tags.length > 0) {
        output += `**Tags:** ${prompt.tags.join(', ')}\n`;
      }
      
      output += `**Created:** ${new Date(prompt.createdAt).toLocaleString()}\n`;
      output += `**Updated:** ${new Date(prompt.updatedAt).toLocaleString()}\n\n`;

      if (prompt.arguments.length > 0) {
        output += `### Arguments\n\n`;
        for (const arg of prompt.arguments) {
          output += `- **${arg.name}** (${arg.required ? 'required' : 'optional'})\n`;
          output += `  ${arg.description}\n`;
          if (arg.default !== undefined) {
            output += `  Default: ${JSON.stringify(arg.default)}\n`;
          }
          output += '\n';
        }
      }

      if (prompt.template) {
        output += `### Template\n\n\`\`\`\n${prompt.template}\n\`\`\`\n\n`;
      }

      if (prompt.messages && prompt.messages.length > 0) {
        output += `### Messages\n\n`;
        for (const message of prompt.messages) {
          output += `**${message.role}:**\n`;
          if (message.content.text) {
            output += `${message.content.text}\n\n`;
          }
        }
      }

      if (prompt.metadata && Object.keys(prompt.metadata).length > 0) {
        output += `### Metadata\n\n\`\`\`json\n${JSON.stringify(prompt.metadata, null, 2)}\n\`\`\`\n`;
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