import { PromptRegistry } from '../features/prompts/registry.js';
import { projectKickoffPrompt } from './project-kickoff.js';
import { dailyStandupPrompt } from './daily-standup.js';
import { codeReviewChecklistPrompt } from './code-review-checklist.js';
import { findSolutionPrompt } from './find-solution.js';
import { draftPrPrompt } from './draft-pr.js';

/**
 * Register all available prompts with the MCP server
 */
export function registerPrompts(registry: PromptRegistry): void {
  registry.registerPrompts([
    projectKickoffPrompt,
    dailyStandupPrompt,
    codeReviewChecklistPrompt,
    findSolutionPrompt,
    draftPrPrompt
  ]);
}