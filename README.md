# Mastodon MCP

A [Model Context Protocol](https://github.com/thefocus/modelcontextprotocol) server that provides tools for interacting with Mastodon. Currently supports creating toots with optional media attachments.

## Features

- Create toots with customizable visibility and content warnings
- Upload and attach media files (images, videos, audio)
- Add alt text/descriptions to media attachments
- Secure credential management using 1Password CLI

## Prerequisites

- Node.js 18+
- pnpm
- 1Password CLI (`op`) installed and configured
- A Mastodon account and API access token

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd mastodon-mcp

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Configuration

The tool requires a Mastodon API token stored in 1Password. Store your token at:

- `op://Personal/Floss.Social Key/notesPlain`

You can optionally set the Mastodon instance URL via environment variable:

```bash
export MASTODON_INSTANCE_URL="https://your.instance.social"
```

If not set, it defaults to `https://floss.social`.

## Usage

Start the MCP server:

```bash
pnpm start
```

The server exposes a single tool `mastodon_create_toot` with the following parameters:

- `content` (required): The text content of your toot
- `visibility`: One of "public", "unlisted", "private", or "direct" (default: "public")
- `sensitive`: Boolean flag for sensitive content (default: false)
- `spoiler_text`: Warning text shown before the content (default: "")
- `media_file`: Path to a media file to attach
- `media_description`: Alt text/description for the attached media

### Example Usage with MCP Inspector

1. Start the inspector:

```bash
npx @modelcontextprotocol/inspector node dist/mcp-server.js
```

2. Open http://localhost:5173 in your browser

3. Use the tool with parameters like:

```json
{
  "content": "Hello from MCP!",
  "visibility": "public",
  "media_file": "/path/to/image.jpg",
  "media_description": "A beautiful sunset"
}
```

## Development

```bash
# Run in development mode with auto-reloading
pnpm dev

# Build the project
pnpm build

# Run the built server
pnpm start
```

## Security

- No credentials are hardcoded in the codebase
- API tokens are securely stored in and retrieved from 1Password
- API responses are git-ignored to prevent accidental credential leaks

## License

ISC
