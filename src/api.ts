import {
  CreateStatusParams,
  MastodonStatus,
  MastodonError,
  MastodonMediaAttachment,
  StatusOrScheduledStatus,
} from "./mastodon_types.js";
import { Readable } from "stream";

export class MastodonClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(instanceUrl: string, accessToken: string) {
    this.baseUrl = instanceUrl.replace(/\/$/, "");
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: unknown,
    isFormData: boolean = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: isFormData
        ? (body as FormData)
        : body
        ? JSON.stringify(body)
        : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as MastodonError).error);
    }

    return data as T;
  }

  async uploadMedia(
    file: Buffer | Uint8Array,
    filename: string,
    description?: string
  ): Promise<MastodonMediaAttachment> {
    const formData = new FormData();
    const blob = new Blob([file], { type: this.getMimeType(filename) });
    formData.append("file", blob, filename);

    if (description) {
      formData.append("description", description);
    }

    return this.request<MastodonMediaAttachment>(
      "/api/v1/media",
      "POST",
      formData,
      true
    );
  }

  private getMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      case "mp4":
        return "video/mp4";
      case "mov":
        return "video/quicktime";
      case "webm":
        return "video/webm";
      default:
        return "application/octet-stream";
    }
  }

  async createStatus(params: CreateStatusParams): Promise<StatusOrScheduledStatus> {
    const payload: CreateStatusParams = {
      status: params.status,
      visibility: params.visibility,
      sensitive: params.sensitive,
      spoiler_text: params.spoiler_text,
      language: params.language,
      media_ids: params.media_ids,
      poll: params.poll,
      in_reply_to_id: params.in_reply_to_id,
    };
    if (params.scheduled_at) {
      payload.scheduled_at = params.scheduled_at;
    }
    return this.request<StatusOrScheduledStatus>("/api/v1/statuses", "POST", payload);
  }
}
