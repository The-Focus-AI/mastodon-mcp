import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MastodonClient } from "./api.js";
import { loadMastodonConfig } from "./config.js";
import { z } from "zod";
import { readFile } from "fs/promises";

const TootSchema = z.object({
  content: z.string().describe("The text content of the toot"),
  visibility: z
    .enum(["public", "unlisted", "private", "direct"])
    .describe("The visibility level of the toot")
    .default("public"),
  sensitive: z
    .boolean()
    .describe("Mark the toot as sensitive content")
    .default(false),
  spoiler_text: z
    .string()
    .describe("Text to be shown as a warning before the actual content")
    .default(""),
  media_file: z
    .string()
    .describe("Path to a media file to attach (image, video, or audio)")
    .optional(),
  media_description: z
    .string()
    .describe("Alt text / description for the attached media")
    .optional(),
  scheduled_at: z
    .string()
    .datetime({ offset: true, message: "Invalid datetime string, expected ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ, YYYY-MM-DDTHH:mm:ss.sss+HH:MM)" })
    .describe("Optional ISO 8601 datetime string to schedule the toot for a future time. Examples: 2024-01-01T10:00:00Z, 2024-01-01T10:00:00+01:00")
    .optional(),
});

const TimelineSchema = z.object({
  timeline_type: z
    .enum(["home", "public", "local"])
    .describe("Type of timeline to fetch")
    .default("home"),
  limit: z
    .number()
    .min(1)
    .max(40)
    .describe("Number of posts to fetch (1-40)")
    .default(20)
    .optional(),
  max_id: z
    .string()
    .describe("Get posts older than this ID")
    .optional(),
  since_id: z
    .string()
    .describe("Get posts newer than this ID")
    .optional(),
});

const TrendsSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(20)
    .describe("Number of trending hashtags to fetch (1-20)")
    .default(10)
    .optional(),
});

const SearchSchema = z.object({
  query: z.string().describe("Search query text"),
  type: z
    .enum(["accounts", "hashtags", "statuses"])
    .describe("Type of content to search for")
    .optional(),
  limit: z
    .number()
    .min(1)
    .max(40)
    .describe("Number of results to return (1-40)")
    .default(20)
    .optional(),
  resolve: z
    .boolean()
    .describe("Whether to resolve non-local accounts/statuses")
    .default(false)
    .optional(),
  following: z
    .boolean()
    .describe("Only search accounts the user is following")
    .default(false)
    .optional(),
});

type TootParams = z.infer<typeof TootSchema>;
type TimelineParams = z.infer<typeof TimelineSchema>;
type TrendsParams = z.infer<typeof TrendsSchema>;
type SearchParams = z.infer<typeof SearchSchema>;

export async function addMastodonTool(server: McpServer) {
  const config = await loadMastodonConfig();
  const client = new MastodonClient(config.instanceUrl, config.accessToken);

  server.tool(
    "mastodon_create_toot",
    "Create a new toot (status) on Mastodon, optionally with media attachments",
    TootSchema.shape,
    async (params: TootParams) => {
      let media_ids: string[] | undefined;

      if (params.media_file) {
        try {
          const fileData = await readFile(params.media_file);
          const media = await client.uploadMedia(
            fileData,
            params.media_file.split("/").pop() || "image",
            params.media_description
          );
          media_ids = [media.id];
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to upload media: ${errorMessage}`);
        }
      }

      const result = await client.createStatus({
        status: params.content,
        visibility: params.visibility,
        sensitive: params.sensitive,
        spoiler_text: params.spoiler_text,
        media_ids,
        scheduled_at: params.scheduled_at,
      });

      let successMessage: string;

      // Check if 'url' property exists to differentiate MastodonStatus from ScheduledMastodonStatus
      if ('url' in result) { // It's a MastodonStatus (posted immediately)
        const mediaInfo =
          result.media_attachments.length > 0
            ? `\nMedia: ${result.media_attachments.map((m) => m.url).join(", ")}`
            : "";
        successMessage = `Successfully created toot! View it at: ${result.url}${mediaInfo}`;
      } else { // It's a ScheduledMastodonStatus
        const scheduledTime = new Date(result.scheduled_at).toLocaleString();
        let mediaInfo = "";
        if (result.media_attachments && result.media_attachments.length > 0) {
            mediaInfo = `\nMedia will be attached: ${result.media_attachments.length} item(s).`;
        }
        successMessage = `Successfully scheduled toot! ID: ${result.id}. It will be posted at: ${scheduledTime}.${mediaInfo}`;
      }

      return {
        content: [
          {
            type: "text",
            text: successMessage,
          },
        ],
      };
    }
  );

  // Timeline tool
  server.tool(
    "mastodon_get_timeline",
    "Fetch posts from Mastodon timelines (home, public, or local)",
    TimelineSchema.shape,
    async (params: TimelineParams) => {
      const timelineParams = {
        limit: params.limit,
        max_id: params.max_id,
        since_id: params.since_id,
      };

      let posts;
      switch (params.timeline_type) {
        case "home":
          posts = await client.getHomeTimeline(timelineParams);
          break;
        case "public":
          posts = await client.getPublicTimeline(timelineParams);
          break;
        case "local":
          posts = await client.getLocalTimeline(timelineParams);
          break;
        default:
          throw new Error(`Unknown timeline type: ${params.timeline_type}`);
      }

      const summary = `Found ${posts.length} posts from ${params.timeline_type} timeline`;
      const postsList = posts.map((post, index) => {
        const reblogInfo = post.reblog ? ` (reblogged from @${post.reblog.account.acct})` : "";
        const mediaInfo = post.media_attachments.length > 0 ? ` [${post.media_attachments.length} media]` : "";
        return `${index + 1}. @${post.account.acct}${reblogInfo}: ${post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...${mediaInfo}\n   Posted: ${new Date(post.created_at).toLocaleString()}\n   URL: ${post.url}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: `${summary}\n\n${postsList}`,
          },
        ],
      };
    }
  );

  // Trending hashtags tool
  server.tool(
    "mastodon_get_trending_tags",
    "Get currently trending hashtags on Mastodon",
    TrendsSchema.shape,
    async (params: TrendsParams) => {
      const tags = await client.getTrendingTags(params.limit);
      
      if (tags.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No trending hashtags found.",
            },
          ],
        };
      }

      const summary = `Found ${tags.length} trending hashtags`;
      const tagsList = tags.map((tag, index) => {
        const todayHistory = tag.history[0];
        const uses = todayHistory ? `${todayHistory.uses} uses by ${todayHistory.accounts} people` : "No recent data";
        return `${index + 1}. #${tag.name}\n   ${uses}\n   URL: ${tag.url}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: `${summary}\n\n${tagsList}`,
          },
        ],
      };
    }
  );

  // Search tool
  server.tool(
    "mastodon_search",
    "Search for accounts, hashtags, or posts on Mastodon",
    SearchSchema.shape,
    async (params: SearchParams) => {
      const searchParams = {
        q: params.query,
        type: params.type,
        limit: params.limit,
        resolve: params.resolve,
        following: params.following,
      };

      const results = await client.search(searchParams);
      
      const sections = [];
      
      if (results.accounts.length > 0) {
        const accountsList = results.accounts.map((account, index) => {
          return `${index + 1}. @${account.acct} (${account.display_name})\n   Followers: ${account.followers_count} | Following: ${account.following_count} | Posts: ${account.statuses_count}\n   ${account.note.replace(/<[^>]*>/g, '').substring(0, 100)}...\n   URL: ${account.url}`;
        }).join('\n\n');
        sections.push(`**Accounts (${results.accounts.length})**\n${accountsList}`);
      }
      
      if (results.hashtags.length > 0) {
        const hashtagsList = results.hashtags.map((tag, index) => {
          const todayHistory = tag.history[0];
          const uses = todayHistory ? `${todayHistory.uses} uses` : "No recent data";
          return `${index + 1}. #${tag.name} (${uses})\n   URL: ${tag.url}`;
        }).join('\n\n');
        sections.push(`**Hashtags (${results.hashtags.length})**\n${hashtagsList}`);
      }
      
      if (results.statuses.length > 0) {
        const statusesList = results.statuses.map((post, index) => {
          const mediaInfo = post.media_attachments.length > 0 ? ` [${post.media_attachments.length} media]` : "";
          return `${index + 1}. @${post.account.acct}: ${post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...${mediaInfo}\n   Posted: ${new Date(post.created_at).toLocaleString()}\n   URL: ${post.url}`;
        }).join('\n\n');
        sections.push(`**Posts (${results.statuses.length})**\n${statusesList}`);
      }
      
      if (sections.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No results found for query: "${params.query}"`
            }
          ],
        };
      }
      
      const summary = `Search results for "${params.query}"`;
      return {
        content: [
          {
            type: "text",
            text: `${summary}\n\n${sections.join('\n\n')}`,
          },
        ],
      };
    }
  );
}
