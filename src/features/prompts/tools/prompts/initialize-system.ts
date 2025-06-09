import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PromptsStorage } from '../../storage/storage.js';
import { SYSTEM_PROMPTS } from '../../system-prompts.js';

export function createInitializeSystemPromptsTool(storage: PromptsStorage) {
  return {
    async handler(): Promise<CallToolResult> {
      const existingPrompts = await storage.listPrompts();
      const existingNames = new Set(existingPrompts.map(p => p.name));
      
      let created = 0;
      let skipped = 0;
      
      for (const systemPrompt of SYSTEM_PROMPTS) {
        if (existingNames.has(systemPrompt.name)) {
          skipped++;
          continue;
        }
        
        await storage.createPrompt(systemPrompt);
        created++;
      }
      
      return {
        content: [
          {
            type: 'text' as const,
            text: `System prompts initialized:\n- Created: ${created}\n- Skipped (already exist): ${skipped}\n- Total system prompts: ${SYSTEM_PROMPTS.length}`,
          },
        ],
      };
    },
  };
}