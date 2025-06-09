import { z } from 'zod';
import { PromptDefinition } from '../features/prompts/registry.js';
import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

const argsSchema = {
  workingDirectory: z.string().describe('The working directory for context'),
  query: z.string().describe('The search query or topic to research'),
  library: z.string().optional().describe('Specific library to search in documentation'),
  includeMemories: z.boolean().optional().describe('Whether to search memories too (default: true)'),
  createMemory: z.boolean().optional().describe('Whether to save findings as a new memory (default: false)')
};

export const researchWithDocsPrompt: PromptDefinition<typeof argsSchema> = {
  name: 'research-with-docs',
  description: 'Research a topic using both memories and documentation',
  argsSchema,
  handler: async ({ workingDirectory, query, library, includeMemories = true, createMemory = false }): Promise<GetPromptResult> => {
    const messages = [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please research "${query}" using available resources.

Working Directory: ${workingDirectory}
Search Query: ${query}
${library ? `Focus Library: ${library}` : 'Search All Documentation: yes'}
Include Memories: ${includeMemories}
Create Memory of Findings: ${createMemory}

Research approach:
${includeMemories ? `1. Search agent memories for:
   - Previous solutions to similar problems
   - Notes about ${library || 'relevant libraries'}
   - Recorded best practices or gotchas
   - Past debugging experiences
   
2. ` : '1. '}Search documentation for:
   - API references matching "${query}"
   - Code examples and usage patterns
   - Configuration options
   - Common troubleshooting scenarios

${includeMemories ? '3' : '2'}. Synthesize findings:
   - Combine personal experiences with official documentation
   - Identify gaps in understanding
   - Provide actionable recommendations
   - Include relevant code examples

${createMemory ? `${includeMemories ? '4' : '3'}. Create a memory summarizing:
   - Key findings from the research
   - Useful code patterns discovered
   - Links to important documentation sections
   - Personal insights for future reference` : ''}

Please provide comprehensive research results with practical examples.`
        }
      }
    ];

    return { messages };
  }
};