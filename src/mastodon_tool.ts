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

      const status = await client.createStatus({
        status: params.content,
        visibility: params.visibility,
        sensitive: params.sensitive,
        spoiler_text: params.spoiler_text,
        media_ids,
      });

      const mediaInfo =
        status.media_attachments.length > 0
          ? `\nMedia: ${status.media_attachments.map((m) => m.url).join(", ")}`
          : "";

      return {
        content: [
          {
            type: "text",
            text: `Successfully created toot! View it at: ${status.url}${mediaInfo}`,
          },
        ],
      };
    }
  );
}
