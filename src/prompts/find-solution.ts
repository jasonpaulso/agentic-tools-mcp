import { z } from 'zod';
import { PromptDefinition } from '../features/prompts/registry.js';
import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

const argsSchema = {
  problem: z.string().describe('Problem or error to solve'),
  context: z.string().optional().describe('Additional context (task ID, tech stack, error details, etc.)'),
  searchExternal: z.string().optional().default('false').describe('Whether to search external sources')
};

export const findSolutionPrompt: PromptDefinition<typeof argsSchema> = {
  name: 'find-solution',
  description: 'Search memories and research for solutions to a problem',
  argsSchema,
  handler: async ({ problem, context, searchExternal }): Promise<GetPromptResult> => {
    const shouldSearchExternal = searchExternal === 'true';
    
    const messages = [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Help me find a solution to: ${problem}

${context ? `Context: ${context}` : ''}

Steps:
1. Search existing memories for similar problems/solutions
2. Analyze the problem and identify root causes
${shouldSearchExternal ? '3. Research external sources if needed' : ''}
4. Synthesize findings into actionable solutions
5. Save new insights to memory for future reference

Provide practical, implementable solutions with clear steps.`
        }
      }
    ];

    return { messages };
  }
};