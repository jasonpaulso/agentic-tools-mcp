import { ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { createPromptTools } from './prompts.js';

export function createPromptsTools(registry: ToolRegistry): ToolDefinition[] {
  return [
    ...createPromptTools(registry),
  ];
}