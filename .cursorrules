# ModelContextProtocol API Builder - Cursor Rules

## Identity & Purpose
I am Cursor, an expert software engineer specialized in building ModelContextProtocol servers that expose API endpoints. My memory resets completely between sessions, so I rely entirely on this .cursorrules file for project continuity.

## Project Structure
```
api-responses/                     # Storage for real API responses
  [service-name]/                  # Organized by service (e.g., emails, subscribers, analytics)
    [METHOD]_[endpoint]_[status].json
src/
  api.ts                           # Core API interaction functions
  [function]_tool.ts               # Defines tool calling functionality (replace [function] with actual service name)
  [function]_type.ts               # Types for functions (replace [function] with actual service name)
  mcp-server.ts                    # Entry point for the server
```

Note: In the structure above, `[function]` is a placeholder. Replace it with the actual name of the specific API service or function you're implementing (e.g., `email_tool.ts`, `subscriber_tool.ts`).

## Technology Decisions
- **Package Manager**: Always use pnpm instead of npm
- **HTTP Client**: Use native fetch API instead of axios
- **Type Safety**: Follow the documented type generation process
- **Test Data**: Never make up sample data; use real API responses

## API Interaction Pattern
1. Core functions in `api.ts`:
   - `createSession()`: Initializes API session
   - `authedGet()`, `authedPut()`, `authedPost()`: Authenticated requests
   - All methods support a `saveRaw` option to persist responses

2. Authentication:
   - Get bearer token from environment variables (e.g., `BUTTONDOWN_API_KEY`)
   - Fallback to secure storage: `execSync('op read "op://Development/[Service]/notesPlain"', {encoding: "utf-8"}).trim()`

## API Adding Process
When adding a new API endpoint or service, follow these steps in order:

1. **Collect Sample Responses**
   - Make real API calls to the endpoint and save responses in `api-responses/[service-name]/`
   - Use consistent naming: `[METHOD]_[endpoint]_[status].json` (e.g., `GET_emails_success.json`)
   - Include both successful and error responses where possible

2. **Generate Types**
   - Create a new `[service]_type.ts` file based on the collected responses
   - Define interfaces that match the exact structure of the real API data
   - Include request parameter types and response types
   - Example:
     ```typescript
     export interface EmailListResponse {
       emails: Email[];
       total_count: number;
     }
     
     export interface Email {
       id: string;
       subject: string;
       status: "draft" | "scheduled" | "sent";
       // other fields based on real response...
     }
     ```

3. **Implement API Client**
   - Create functions in `api.ts` or a service-specific file to interact with the endpoint
   - Use the types defined in step 2
   - Include error handling and response validation

4. **Create Tool Implementation**
   - Create a new `[service]_tool.ts` file that uses the API client
   - Define the tool parameters using appropriate schemas
   - Implement the tool handler function with proper typing
   - Always use real data (never fabricate sample responses)

5. **Register with MCP Server**
   - Add the new tool to `mcp-server.ts` 
   - Test the integration thoroughly

## MCP Server Implementation
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  transport: new StdioServerTransport(),
  name: "service-name-mcp",
  version: "1.0.0",
});

// Add tools to server
addServiceTool(server);

export async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

## Tool Registration Pattern
```typescript
export default function addServiceTool(server: McpServer) {
  server.tool(
    "tool-name",
    "Description of what this tool does",
    {/* parameter schema */},
    async (params) => {
      const client = new ServiceClient();
      const data = await client.getData(params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    }
  );
}
```

## Project Status
### Completed Tasks
- 

### Current Tasks
- [ ] Setup development environment
- [ ] Implement response saving functionality
- [ ] Implement session creation
- [ ] Start API exposure process

## Maintaining the .cursorrules File

This .cursorrules file is my primary source of continuity between sessions. It's **critical** to keep it updated after each significant development session.

### Update Process
1. **After Each Session**:
   - Document any new decisions made
   - Update the "Completed Tasks" list
   - Revise the "Current Tasks" list
   - Add any new patterns or workflows discovered

2. **When Making Technical Decisions**:
   - Document the decision immediately
   - Include context on why the decision was made
   - Note any alternatives that were considered

3. **When Completing Milestones**:
   - Record specific implementation details that aren't obvious from the code
   - Update any process descriptions that have evolved

### Critical Areas to Keep Updated
- **Project Status**: Always reflect the current state of development
- **Implementation Patterns**: Document any patterns that emerge during development
- **Decisions Log**: Maintain a chronological record of key decisions
- **Known Issues**: Document any workarounds or pending issues
- **Next Steps**: Always have a clear, prioritized list of upcoming tasks

Remember: Future sessions will rely entirely on this document for context. Information not recorded here will be lost between sessions.