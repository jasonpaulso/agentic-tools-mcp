import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PromptsStorage } from '../../storage/storage.js';
import { PromptMessage, PromptExecutionResult } from '../../models/prompt.js';

export interface ExecutePromptInput {
  id: string;
  arguments?: Record<string, any>;
}

export function createExecutePromptTool(storage: PromptsStorage) {
  return {
    async handler(input: ExecutePromptInput): Promise<CallToolResult> {
      const prompt = await storage.getPrompt(input.id);
      const providedArgs = input.arguments || {};

      // Validate required arguments
      const missingArgs = prompt.arguments
        .filter(arg => arg.required && !(arg.name in providedArgs))
        .map(arg => arg.name);

      if (missingArgs.length > 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Missing required arguments: ${missingArgs.join(', ')}`,
            },
          ],
          isError: true,
        };
      }

      // Apply defaults for missing optional arguments
      const finalArgs: Record<string, any> = {};
      for (const arg of prompt.arguments) {
        if (arg.name in providedArgs) {
          finalArgs[arg.name] = providedArgs[arg.name];
        } else if (arg.default !== undefined) {
          finalArgs[arg.name] = arg.default;
        }
      }

      // Generate messages based on prompt configuration
      let messages: PromptMessage[] = [];

      if (prompt.template) {
        // Replace template variables with argument values
        let processedTemplate = prompt.template;
        for (const [key, value] of Object.entries(finalArgs)) {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          processedTemplate = processedTemplate.replace(regex, String(value));
        }

        messages.push({
          role: 'user',
          content: {
            type: 'text',
            text: processedTemplate,
          },
        });
      } else if (prompt.messages) {
        // Process predefined messages
        messages = prompt.messages.map(msg => {
          if (msg.content.text) {
            let processedText = msg.content.text;
            for (const [key, value] of Object.entries(finalArgs)) {
              const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
              processedText = processedText.replace(regex, String(value));
            }
            return {
              ...msg,
              content: {
                ...msg.content,
                text: processedText,
              },
            };
          }
          return msg;
        });
      } else {
        // Default message if no template or messages defined
        messages.push({
          role: 'user',
          content: {
            type: 'text',
            text: `Execute prompt: ${prompt.name}\nArguments: ${JSON.stringify(finalArgs, null, 2)}`,
          },
        });
      }

      // Return the execution result
      const result: PromptExecutionResult = {
        messages,
        metadata: {
          promptId: prompt.id,
          promptName: prompt.name,
          executedAt: new Date().toISOString(),
          arguments: finalArgs,
        },
      };

      // Format output for MCP
      let output = `## Executed Prompt: ${prompt.name}\n\n`;
      
      for (const message of result.messages) {
        output += `### ${message.role}:\n`;
        if (message.content.text) {
          output += `${message.content.text}\n\n`;
        }
      }

      output += `---\n`;
      output += `*Prompt ID: ${prompt.id}*\n`;
      output += `*Executed with arguments: ${JSON.stringify(finalArgs, null, 2)}*`;

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