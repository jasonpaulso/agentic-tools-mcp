#!/usr/bin/env node

import { parseCommandLineArgs } from "./utils/storage-config.js";
import { getVersionString } from "./utils/version.js";

/**
 * Main entry point for the MCP task management server
 * Now uses HTTP transport for communication with MCP clients
 */
async function main() {
  try {
    // Parse command-line arguments
    const storageConfig = parseCommandLineArgs();

    // Dynamic import to avoid top-level await issues
    await import("./server.js");

    // Log server start
    console.log(
      `🚀 Agentic Tools MCP Server ${getVersionString()} started successfully`
    );
    console.log("🌐 HTTP server listening on http://localhost:3000");
    console.log("");

    // Show storage mode
    if (storageConfig.useGlobalDirectory) {
      console.log("📁 Default mode: Global directory (~/.agentic-tools-mcp/)");
      console.log(
        '   Note: Clients can override this with "mcp-use-global-directory" header'
      );
    } else {
      console.log(
        "📁 Default mode: Project-specific (.agentic-tools-mcp/ within each working directory)"
      );
      console.log(
        '   Note: Clients can enable global mode with "mcp-use-global-directory: true" header'
      );
    }
    console.log("");

    console.log("📋 Task Management features available:");
    console.log("   • Project Management (list, create, get, update, delete)");
    console.log("   • Task Management (list, create, get, update, delete)");
    console.log("   • Subtask Management (list, create, get, update, delete)");
    console.log("");
    console.log("🧠 Agent Memories features available:");
    console.log(
      "   • Memory Management (create, search, get, list, update, delete)"
    );
    console.log(
      "   • Intelligent multi-field text search with relevance scoring"
    );
    console.log("   • JSON file storage with title/content architecture");
    console.log("");
    console.log(
      "💡 Use list_projects to get started with tasks, or create_memory for memories!"
    );
  } catch (error) {
    console.error("❌ Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down MCP server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
