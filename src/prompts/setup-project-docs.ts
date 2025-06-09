import { z } from 'zod';
import { PromptDefinition } from '../features/prompts/registry.js';
import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

const argsSchema = {
  workingDirectory: z.string().describe('The working directory of the project'),
  includeDevDeps: z.boolean().optional().describe('Whether to include dev dependencies (default: true)'),
  autoFetch: z.boolean().optional().describe('Whether to automatically fetch all docs (default: false)')
};

export const setupProjectDocsPrompt: PromptDefinition<typeof argsSchema> = {
  name: 'setup-project-docs',
  description: 'Initialize documentation for project dependencies by analyzing package.json',
  argsSchema,
  handler: async ({ workingDirectory, includeDevDeps = true, autoFetch = false }): Promise<GetPromptResult> => {
    const messages = [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please help me set up documentation for my project dependencies.

Working Directory: ${workingDirectory}
Include Dev Dependencies: ${includeDevDeps}
Auto-fetch Documentation: ${autoFetch}

Steps needed:
1. Read and analyze package.json to identify all dependencies
2. Categorize dependencies (runtime vs dev, frameworks vs utilities)
3. ${autoFetch ? 'Automatically fetch' : 'Prepare a plan to fetch'} documentation for each dependency
4. Store documentation locally for offline access
5. Create a summary of what was ${autoFetch ? 'fetched' : 'identified'}

Please focus on:
- Matching exact versions from package.json
- Prioritizing core framework documentation
- Including popular utility libraries
- Setting up both project-specific and global caches

${autoFetch ? 'Start fetching documentation now.' : 'Show me the plan and let me choose which docs to fetch.'}`
        }
      }
    ];

    return { messages };
  }
};