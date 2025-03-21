import { execSync } from "child_process";

export interface MastodonConfig {
  instanceUrl: string;
  accessToken: string;
}

export async function loadMastodonConfig(): Promise<MastodonConfig> {
  try {
    const accessToken = execSync(
      'op read "op://Personal/Floss.Social Key/notesPlain"',
      {
        encoding: "utf-8",
      }
    ).trim();

    // First check environment variable, fall back to floss.social
    const instanceUrl =
      process.env.MASTODON_INSTANCE_URL || "https://floss.social";

    if (!accessToken) {
      throw new Error("Failed to load access token from 1Password");
    }

    return {
      instanceUrl,
      accessToken,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load Mastodon configuration: ${error.message}`
      );
    }
    throw new Error("Failed to load Mastodon configuration");
  }
}
