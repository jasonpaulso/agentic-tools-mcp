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
import "dotenv/config";
import express from "express";
import { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "node:crypto";
import { createAgentMemoryTools } from "./tools/agent-memories/index.js";
import { createDocumentationTools } from "./tools/documentation/index.js";
import { ToolRegistry } from "./tools/registry.js";
import { createTaskManagementTools } from "./tools/task-management/index.js";
import { createUnifiedSearchTools } from "./tools/unified-search/index.js";
import { PromptRegistry } from "./features/prompts/registry.js";
import { registerPrompts } from "./prompts/index.js";
import { StorageConfig } from "./utils/storage-config.js";
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
        ...createUnifiedSearchTools(registry),
      ]);

      // Create prompt registry and register all prompts
      const promptRegistry = new PromptRegistry(server, config);
      registerPrompts(promptRegistry);


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
