import { z } from 'zod';
import { PromptDefinition } from '../features/prompts/registry.js';
import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

const argsSchema = {
  projectType: z.string().describe('Type of project (web-app, api, library, cli, mobile-app, etc.)'),
  projectName: z.string().describe('Name of the project'),
  techStack: z.string().optional().describe('Primary technologies to use (e.g., "React, TypeScript, Node.js")'),
  description: z.string().optional().describe('Brief description of the project')
};

export const projectKickoffPrompt: PromptDefinition<typeof argsSchema> = {
  name: 'project-kickoff',
  description: 'Initialize a new project with standard structure and initial tasks',
  argsSchema,
  handler: async ({ projectType, projectName, techStack, description }): Promise<GetPromptResult> => {
    const messages = [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `I need to set up a new ${projectType} project called "${projectName}".

Project Details:
- Type: ${projectType}
- Name: ${projectName}
${techStack ? `- Tech Stack: ${techStack}` : ''}
${description ? `- Description: ${description}` : ''}

Please help me:
1. Create the project with appropriate initial structure
2. Set up standard configuration files  
3. Generate initial tasks for development
4. Create memory entries for key project decisions

Focus on best practices for ${projectType} projects${techStack ? ` using ${techStack}` : ''}.`
        }
      }
    ];

    return { messages };
  }
};