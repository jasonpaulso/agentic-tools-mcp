import { PromptDefinition } from '../features/prompts/registry.js';
import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

export const draftPrPrompt: PromptDefinition = {
  name: 'draft-pr',
  description: 'Generate a pull request description based on a diff',
  handler: async (): Promise<GetPromptResult> => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please generate a pull request description based on the provided diff and information.

The description should include:

1. **Summary of Changes**
   - A brief overview of what this PR does
   - Key functionality added or modified

2. **Implementation Details**
   - Technical approach used
   - Any design patterns or architecture decisions worth noting
   - Dependencies added or removed

3. **Testing**
   - What tests have been added
   - How to verify the changes work correctly

4. **Related Issues**
   - Links to related issues or tickets
   - How this PR addresses those issues

5. **Screenshots or Examples** (if applicable)
   - Suggest what screenshots or examples would be helpful

Please format the PR description using markdown, with clear sections and bullet points where appropriate.`
          }
        }
      ]
    };
  }
};