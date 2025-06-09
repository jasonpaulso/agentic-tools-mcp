import { z } from 'zod';
import { PromptDefinition } from '../features/prompts/registry.js';
import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

const argsSchema = {
  taskId: z.string().describe('Task that was implemented'),
  files: z.string().optional().describe('List of files changed (optional)'),
  prNumber: z.string().optional().describe('Pull request number (optional)')
};

export const codeReviewChecklistPrompt: PromptDefinition<typeof argsSchema> = {
  name: 'code-review-checklist',
  description: 'Generate code review checklist based on task implementation',
  argsSchema,
  handler: async ({ taskId, files, prNumber }): Promise<GetPromptResult> => {
    const messages = [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Generate a code review checklist for task ${taskId}${prNumber ? ` (PR #${prNumber})` : ''}.

${files ? `Files changed: ${files}` : ''}

Create a comprehensive checklist covering:
1. Functionality and requirements
2. Code quality and standards
3. Performance considerations
4. Security implications
5. Testing coverage
6. Documentation needs

Base the checklist on the task details and any coding standards stored in memories.`
        }
      }
    ];

    return { messages };
  }
};