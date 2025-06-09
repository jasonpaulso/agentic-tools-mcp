import { z } from 'zod';
import { PromptDefinition } from '../features/prompts/registry.js';
import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

const argsSchema = {
  projectId: z.string().optional().describe('Project to report on (optional, defaults to all)'),
  lookbackDays: z.string().optional().default('1').describe('Number of days to look back for progress')
};

export const dailyStandupPrompt: PromptDefinition<typeof argsSchema> = {
  name: 'daily-standup',
  description: 'Generate daily standup report with progress and blockers',
  argsSchema,
  handler: async ({ projectId, lookbackDays }): Promise<GetPromptResult> => {
    const messages = [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Generate a daily standup report ${projectId ? `for project ${projectId}` : 'for all active projects'}.

Analyze work from the last ${lookbackDays} day(s) and provide:
1. Tasks completed yesterday
2. Tasks in progress today
3. Any blockers or issues
4. Next priorities

Format as a concise standup update suitable for team communication.`
        }
      }
    ];

    return { messages };
  }
};