import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Base interface for all MCP tools
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  handler: (args: any) => Promise<CallToolResult>;
}

/**
 * Configuration passed to tool factories
 */
export interface ToolConfig {
  useGlobalDirectory: boolean;
}

/**
 * Standard error handler for tools
 */
export function handleToolError(error: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      },
    ],
    isError: true,
  };
}

/**
 * Creates a tool with standard error handling
 */
export function createTool(
  name: string,
  description: string,
  inputSchema: z.ZodSchema<any>,
  handler: (args: any) => Promise<CallToolResult>
): ToolDefinition {
  return {
    name,
    description,
    inputSchema,
    handler: async (args: any) => {
      try {
        return await handler(args);
      } catch (error) {
        return handleToolError(error);
      }
    },
  };
}