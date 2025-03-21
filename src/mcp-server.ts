import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { addMastodonTool } from "./mastodon_tool.js";

async function main() {
  const transport = new StdioServerTransport();
  const server = new McpServer({
    transport,
    name: "mastodon-mcp",
    version: "1.0.0",
  });

  // Add Mastodon tool to server
  await addMastodonTool(server);

  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
