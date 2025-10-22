import {
  CreateStatusParams,
  MastodonStatus,
  MastodonError,
  MastodonMediaAttachment,
  StatusOrScheduledStatus,
  TimelineParams,
  MastodonTrendingTag,
  SearchParams,
  MastodonSearchResults,
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

    const responseText = await response.text();
    // This log will show the raw response from the server, helping you debug.
    console.error(`[Mastodon API Debug] Status: ${response.status}, Body: ${responseText}`);

    if (!response.ok) {
        // Attempt to parse the error, but fallback to the raw text if it's not JSON.
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorJson = JSON.parse(responseText);
            errorMessage = (errorJson as MastodonError).error || JSON.stringify(errorJson);
        } catch (e) {
            errorMessage = `${errorMessage}: ${responseText}`;
        }
        throw new Error(errorMessage);
    }

    // On success, parse the JSON. If this fails, the original error will be thrown.
    return JSON.parse(responseText) as T;
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

  // Timeline methods
  async getHomeTimeline(params: TimelineParams = {}): Promise<MastodonStatus[]> {
    const queryParams = this.buildQueryParams(params);
    return this.request<MastodonStatus[]>(`/api/v1/timelines/home${queryParams}`);
  }

  async getPublicTimeline(params: TimelineParams = {}): Promise<MastodonStatus[]> {
    const queryParams = this.buildQueryParams(params);
    return this.request<MastodonStatus[]>(`/api/v1/timelines/public${queryParams}`);
  }

  async getLocalTimeline(params: TimelineParams = {}): Promise<MastodonStatus[]> {
    const localParams = { ...params, local: true };
    const queryParams = this.buildQueryParams(localParams);
    return this.request<MastodonStatus[]>(`/api/v1/timelines/public${queryParams}`);
  }

  // Trending methods
  async getTrendingTags(limit: number = 10): Promise<MastodonTrendingTag[]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    return this.request<MastodonTrendingTag[]>(`/api/v1/trends/tags${queryParams}`);
  }

  // Search methods
  async search(params: SearchParams): Promise<MastodonSearchResults> {
    const queryParams = this.buildQueryParams(params);
    return this.request<MastodonSearchResults>(`/api/v2/search${queryParams}`);
  }

  private buildQueryParams(params: Record<string, any>): string {
    const filteredParams: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        filteredParams[key] = String(value);
      }
    }
    
    const queryString = new URLSearchParams(filteredParams).toString();
    return queryString ? `?${queryString}` : "";
  }
}
