/**
 * HTTP-based MCP server for Agentic Tools with backwards compatibility
 * 
 * This server supports two transport methods:
 * 
 * 1. StreamableHTTPServerTransport (modern protocol):
 *    - Endpoints: /mcp (POST/GET/DELETE)
 *    - Supports resumability and session management
 * 
 * 2. SSEServerTransport (legacy protocol for SSE-limited clients):
 *    - Endpoints: /sse (GET), /messages (POST)
 *    - Provides backwards compatibility for older clients
 * 
 * Configuration:
 * - To enable global directory mode (equivalent to --claude flag), clients should set
 *   the "mcp-use-global-directory: true" header in the initial request
 * - Otherwise, project-specific storage will be used (default)
 */
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "node:crypto";
import { StorageConfig } from "./utils/storage-config.js";
import { getVersion } from "./utils/version.js";
import { ToolRegistry } from "./tools/registry.js";
import { createTaskManagementTools } from "./tools/task-management/index.js";
import { createAgentMemoryTools } from "./tools/agent-memories/index.js";
import { createPromptsTools } from "./tools/prompts/index.js";

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport | SSEServerTransport } = {};

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
      // Reuse existing transport - ensure it's a StreamableHTTPServerTransport
      const existingTransport = transports[sessionId];
      if (!(existingTransport instanceof StreamableHTTPServerTransport)) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Session is not a StreamableHTTP session",
          },
          id: null,
        }));
        return;
      }
      transport = existingTransport;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Get storage config from headers
      // Clients should set "mcp-use-global-directory: true" header to enable global directory mode
      const useGlobalDirectory = req.headers["mcp-use-global-directory"] === "true";
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

      const server = new McpServer({
        name: "@pimzino/agentic-tools-mcp",
        version: getVersion(),
      });

      // Create tool registry
      const registry = new ToolRegistry(server, config);

      // Register all tools
      registry.registerTools([
        ...createTaskManagementTools(registry),
        ...createAgentMemoryTools(registry),
        ...createPromptsTools(registry),
      ]);

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
  
  // Ensure this is a StreamableHTTPServerTransport
  if (!(transport instanceof StreamableHTTPServerTransport)) {
    res.statusCode = 400;
    res.end("Session is not a StreamableHTTP session");
    return;
  }
  
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get("/mcp", handleSessionRequest);

// Handle DELETE requests for session termination
app.delete("/mcp", handleSessionRequest);

// ============================================
// Backwards compatibility for SSE limited clients
// ============================================

// Handle SSE connections for older clients
app.get("/sse", async (req: express.Request, res: express.Response) => {
  console.log("SSE connection requested (legacy client)");
  
  // Get storage config from headers
  const useGlobalDirectory = req.headers["mcp-use-global-directory"] === "true";
  const config: StorageConfig = {
    useGlobalDirectory,
  };

  // Create SSE transport
  const transport = new SSEServerTransport("/messages", res);
  
  // Store transport and config by session ID
  transports[transport.sessionId] = transport;
  sessionConfigs[transport.sessionId] = config;
  
  // Clean up on connection close
  res.on("close", () => {
    delete transports[transport.sessionId];
    delete sessionConfigs[transport.sessionId];
    console.log(`SSE connection closed: ${transport.sessionId}`);
  });

  // Create and connect server
  const server = new McpServer({
    name: "@pimzino/agentic-tools-mcp",
    version: getVersion(),
  });

  // Create tool registry
  const registry = new ToolRegistry(server, config);

  // Register all tools
  registry.registerTools([
    ...createTaskManagementTools(registry),
    ...createAgentMemoryTools(registry),
  ]);

  // Connect to the MCP server
  await server.connect(transport);
  
  console.log(`SSE transport initialized: ${transport.sessionId}`);
});

// Handle messages from SSE clients
app.post("/messages", async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Invalid or missing session ID",
      },
      id: null,
    });
    return;
  }
  
  const transport = transports[sessionId];
  
  // Ensure this is an SSE transport
  if (!(transport instanceof SSEServerTransport)) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Session is not an SSE session",
      },
      id: null,
    });
    return;
  }
  
  // Handle the message
  await transport.handleMessage(req.body);
  
  // SSE transport doesn't send responses via POST
  res.status(200).json({ success: true });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    version: getVersion(),
    uptime: process.uptime(),
    sessions: Object.keys(transports).length
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🌐 HTTP MCP server ready on port ${PORT}`);
  console.log(`   - Modern clients: POST/GET/DELETE /mcp`);
  console.log(`   - Legacy SSE clients: GET /sse, POST /messages`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  
  // Close all transports
  for (const sessionId of Object.keys(transports)) {
    const transport = transports[sessionId];
    if (transport && "close" in transport) {
      await transport.close();
    }
  }
  
  // Close the server
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});