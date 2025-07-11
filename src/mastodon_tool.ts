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

type TootParams = z.infer<typeof TootSchema>;

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
}
