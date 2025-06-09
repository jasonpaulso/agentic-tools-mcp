import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodRawShape } from "zod";
import { StorageConfig } from "../../utils/storage-config.js";

export interface PromptDefinition<
  Args extends ZodRawShape | undefined = undefined
> {
  name: string;
  description: string;
  argsSchema?: Args;
  handler: Args extends ZodRawShape
    ? (
        args: z.infer<z.ZodObject<Args>>
      ) => GetPromptResult | Promise<GetPromptResult>
    : () => GetPromptResult | Promise<GetPromptResult>;
}

/**
 * Registry for managing MCP prompts
 */
export class PromptRegistry {
  private prompts: Map<string, PromptDefinition<any>> = new Map();

  constructor(
    private server: McpServer,
    public readonly config: StorageConfig
  ) {}

  /**
   * Register a prompt with the MCP server
   */
  registerPrompt<Args extends ZodRawShape | undefined = undefined>(
    prompt: PromptDefinition<Args>
  ): void {
    this.prompts.set(prompt.name, prompt);

    if (prompt.argsSchema) {
      this.server.prompt(
        prompt.name,
        prompt.description,
        prompt.argsSchema,
        prompt.handler as any
      );
    } else {
      this.server.prompt(
        prompt.name,
        prompt.description,
        prompt.handler as any
      );
    }
  }

  /**
   * Register multiple prompts at once
   */
  registerPrompts(prompts: PromptDefinition<any>[]): void {
    prompts.forEach((prompt) => this.registerPrompt(prompt));
  }

  /**
   * Get all registered prompts
   */
  getPrompts(): PromptDefinition<any>[] {
    return Array.from(this.prompts.values());
  }
}
