/**
 * HTTP-based MCP server for Agentic Tools with Prompts support
 *
 * This server uses StreamableHTTPServerTransport to provide MCP functionality over HTTP.
 *
 * Configuration:
 * - To enable global directory mode (equivalent to --claude flag), clients should set
 *   the "mcp-use-global-directory: true" header in the initial request
 * - Otherwise, project-specific storage will be used (default)
 */
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FileStorage as PromptsFileStorage } from "./features/prompts/storage/file-storage.js";
import { SYSTEM_PROMPTS } from "./features/prompts/system-prompts.js";
import { createAgentMemoryTools } from "./tools/agent-memories/index.js";
import { ToolRegistry } from "./tools/registry.js";
import { createTaskManagementTools } from "./tools/task-management/index.js";
import { createDocumentationTools } from "./tools/documentation/index.js";
import {
  resolveWorkingDirectory,
  StorageConfig,
} from "./utils/storage-config.js";
import { getVersion } from "./utils/version.js";

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Map to store storage configurations by session ID
const sessionConfigs: { [sessionId: string]: StorageConfig } = {};

// Handle POST requests for client-to-server communication
app.post(
  "/mcp",
  async (
    req: IncomingMessage & { auth?: AuthInfo; body: any },
    res: ServerResponse<IncomingMessage>
  ) => {
    // Check for existing session ID
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Get storage config from headers
      // Clients should set "mcp-use-global-directory: true" header to enable global directory mode
      const useGlobalDirectory =
        req.headers["mcp-use-global-directory"] === "true";
      const config: StorageConfig = {
        useGlobalDirectory,
      };

      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          // Store the transport and config by session ID
          transports[sessionId] = transport;
          sessionConfigs[sessionId] = config;
        },
      });

      // Clean up transport and config when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          delete sessionConfigs[transport.sessionId];
        }
      };

      const server = new McpServer(
        {
          name: "@jasonpaulso/agentic-tools-mcp",
          version: getVersion(),
        },
        {
          capabilities: {
            prompts: {},
            tools: {},
          },
        }
      );

      // Create tool registry
      const registry = new ToolRegistry(server, config);

      // Register all tools
      registry.registerTools([
        ...createTaskManagementTools(registry),
        ...createAgentMemoryTools(registry),
        ...createDocumentationTools(registry),
      ]);

      // Setup prompts storage
      const createPromptStorage = async (
        workingDirectory: string
      ): Promise<PromptsFileStorage> => {
        const resolvedDirectory = resolveWorkingDirectory(
          workingDirectory,
          config
        );
        const storage = new PromptsFileStorage(resolvedDirectory);
        await storage.initialize();
        return storage;
      };

      // Initialize system prompts
      const workingDirectory = config.useGlobalDirectory ? "~" : process.cwd();
      const promptStorage = await createPromptStorage(workingDirectory);

      // Check if prompts are already initialized
      const existingPrompts = await promptStorage.listPrompts();
      if (existingPrompts.length === 0) {
        for (const systemPrompt of SYSTEM_PROMPTS) {
          await promptStorage.createPrompt(systemPrompt);
        }
      }

      // Register prompts with McpServer
      const allPrompts = await promptStorage.listPrompts();
      for (const prompt of allPrompts) {
        // Build argument schema dynamically
        const argsSchema: Record<string, any> = {};
        for (const arg of prompt.arguments) {
          if (arg.required) {
            argsSchema[arg.name] = z.string().describe(arg.description);
          } else {
            argsSchema[arg.name] = z
              .string()
              .optional()
              .describe(arg.description);
          }
        }

        // Register the prompt
        server.prompt(
          prompt.name,
          prompt.description,
          argsSchema,
          async (args) => {
            // Process arguments with defaults
            const finalArgs: Record<string, any> = {};
            for (const arg of prompt.arguments) {
              if (args[arg.name] !== undefined) {
                finalArgs[arg.name] = args[arg.name];
              } else if (arg.default !== undefined) {
                finalArgs[arg.name] = arg.default;
              }
            }

            // Generate messages
            const messages: any[] = [];

            if (prompt.template) {
              // Process template
              let processedTemplate = prompt.template;

              // Simple variable substitution
              for (const [key, value] of Object.entries(finalArgs)) {
                const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
                processedTemplate = processedTemplate.replace(
                  regex,
                  String(value)
                );
              }

              // Handle conditional blocks
              processedTemplate = processedTemplate.replace(
                /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs,
                (_match, varName, content) => {
                  return finalArgs[varName] ? content : "";
                }
              );

              messages.push({
                role: "user",
                content: {
                  type: "text",
                  text: processedTemplate.trim(),
                },
              });
            } else if (prompt.messages) {
              // Use predefined messages
              for (const msg of prompt.messages) {
                if (msg.content.text) {
                  let processedText = msg.content.text;
                  for (const [key, value] of Object.entries(finalArgs)) {
                    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
                    processedText = processedText.replace(regex, String(value));
                  }
                  messages.push({
                    role: msg.role,
                    content: {
                      type: "text",
                      text: processedText,
                    },
                  });
                } else {
                  messages.push(msg);
                }
              }
            }

            return { messages };
          }
        );
      }

      // Connect to the MCP server
      await server.connect(transport);
    } else {
      // Invalid request
      res.statusCode = 400;
      res.end({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  }
);

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (
  req: express.Request,
  res: express.Response
) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.statusCode = 400;
    res.end("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get("/mcp", handleSessionRequest);

// Handle DELETE requests for session termination
app.delete("/mcp", handleSessionRequest);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 HTTP MCP server ready on port ${PORT}`);
});
