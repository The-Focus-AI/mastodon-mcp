# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides tools for interacting with Mastodon. The server exposes four tools:
- `mastodon_create_toot` - Create toots with media attachments, scheduling, and visibility settings
- `mastodon_get_timeline` - Fetch posts from home, public, or local timelines
- `mastodon_get_trending_tags` - Get currently trending hashtags
- `mastodon_search` - Search for accounts, hashtags, or posts

## Architecture

The codebase follows a clean, modular architecture with clear separation of concerns:

- **`mcp-server.ts`** - Entry point that initializes the MCP server and registers tools
- **`mastodon_tool.ts`** - Tool registration and parameter validation using Zod schemas
- **`api.ts`** - Core Mastodon API client with HTTP request handling and media upload
- **`config.ts`** - Configuration loading with fallback from environment variables to 1Password CLI
- **`mastodon_types.ts`** - TypeScript interfaces matching real Mastodon API responses

### Key Design Patterns

- **Credential Security**: Never hardcodes credentials; uses environment variables with 1Password CLI fallback
- **Type Safety**: All API interactions are fully typed based on real Mastodon API responses
- **Error Handling**: Comprehensive error handling with meaningful error messages
- **MCP Integration**: Follows standard MCP server patterns with tool registration

## Development Commands

### Building and Running
```bash
# Install dependencies
pnpm install

# Build the TypeScript code
pnpm build

# Run the built server
pnpm start

# Development mode with auto-recompilation
pnpm dev
```

### Testing and Debugging
```bash
# Test with MCP Inspector (interactive web interface)
npx @modelcontextprotocol/inspector node dist/mcp-server.js
# Then open http://localhost:5173 in browser

# Direct server execution for debugging
node dist/mcp-server.js
```

## Configuration Requirements

The server requires a Mastodon API access token. Set one of:

1. **Environment variable**: `MASTODON_ACCESS_TOKEN`
2. **1Password CLI item**: `op://Personal/Floss.Social Key/notesPlain`

Optional environment variables:
- `MASTODON_INSTANCE_URL` (defaults to `https://floss.social`)

## Tool Schemas

### `mastodon_create_toot`
Create a new toot (status) on Mastodon:
- `content` (required): Toot text content
- `visibility`: "public" | "unlisted" | "private" | "direct" (default: "public")  
- `sensitive`: Boolean for sensitive content flag (default: false)
- `spoiler_text`: Warning text shown before content (default: "")
- `media_file`: Path to media file (image/video/audio)
- `media_description`: Alt text for media accessibility
- `scheduled_at`: ISO 8601 datetime string for scheduling

### `mastodon_get_timeline`
Fetch posts from Mastodon timelines:
- `timeline_type`: "home" | "public" | "local" (default: "home")
- `limit`: Number of posts to fetch, 1-40 (default: 20)
- `max_id`: Get posts older than this ID
- `since_id`: Get posts newer than this ID

### `mastodon_get_trending_tags`
Get currently trending hashtags:
- `limit`: Number of hashtags to fetch, 1-20 (default: 10)

### `mastodon_search`
Search for accounts, hashtags, or posts:
- `query` (required): Search query text
- `type`: "accounts" | "hashtags" | "statuses" (searches all types if not specified)
- `limit`: Number of results to return, 1-40 (default: 20)
- `resolve`: Whether to resolve non-local accounts/statuses (default: false)
- `following`: Only search accounts the user is following (default: false)

## Architecture Notes

### API Client Design
The `MastodonClient` class uses native `fetch` API and handles both JSON and FormData payloads. It includes:
- Automatic MIME type detection for media uploads
- Comprehensive error parsing from Mastodon API responses
- Debug logging of all API responses

### Type System
Types are based on real Mastodon API responses and include union types (`StatusOrScheduledStatus`) to handle both immediate posts and scheduled toots.

### Security Model
- No credentials stored in code
- API responses logged for debugging but not persisted
- Follows secure credential retrieval patterns from .cursorrules

### MCP Tool Pattern
Tools are registered using the standard MCP pattern:
1. Zod schema for parameter validation
2. Async handler function with proper error handling
3. Structured response format with text content

## File Structure Conventions

Following the .cursorrules pattern:
- `*_tool.ts` - Tool registration and parameter handling
- `*_types.ts` - TypeScript interfaces for API data
- `api.ts` - Core API client functionality
- `config.ts` - Configuration and credential management