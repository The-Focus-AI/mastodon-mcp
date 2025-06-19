import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";

export interface MastodonConfig {
  instanceUrl: string;
  accessToken: string;
}

export async function loadMastodonConfig(): Promise<MastodonConfig> {
  let accessToken: string | undefined = process.env.MASTODON_ACCESS_TOKEN;

  const instanceUrl =
    process.env.MASTODON_INSTANCE_URL || "https://floss.social";

  if (!accessToken) {
    // If not found in environment variables, try to load from 1Password
    try {
      const opExecOptions: ExecSyncOptionsWithStringEncoding = {
        encoding: "utf-8",
        // Suppress 1Password CLI's stderr output to keep console clean,
        // as failure to load from 1Password is an expected fallback scenario.
        stdio: ['pipe', 'pipe', 'ignore'] 
      };
      const opOutput = execSync(
        'op read "op://Personal/Floss.Social Key/notesPlain"',
        opExecOptions
      ).trim();
      if (opOutput) {
        accessToken = opOutput;
      }
    } catch (error) {
      // 1Password CLI command failed (e.g., not installed, not logged in, item not found).
      console.warn(`Failed to load access token from 1Password: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!accessToken) {
    throw new Error(
      "Mastodon access token could not be loaded. " +
      "Please set the MASTODON_ACCESS_TOKEN environment variable, " +
      "or ensure 1Password CLI is configured and the item 'op://Personal/Floss.Social Key/notesPlain' exists and is readable."
    );
  }

  return {
    instanceUrl,
    accessToken,
  };
}
