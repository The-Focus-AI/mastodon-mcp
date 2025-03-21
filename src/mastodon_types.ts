export interface MastodonMediaMeta {
  original: {
    width: number;
    height: number;
    size: string;
    aspect: number;
  };
  small: {
    width: number;
    height: number;
    size: string;
    aspect: number;
  };
}

export interface MastodonMediaAttachment {
  id: string;
  type: "image" | "video" | "gifv" | "audio";
  url: string;
  preview_url: string;
  remote_url: string | null;
  preview_remote_url: string | null;
  text_url: string | null;
  meta: MastodonMediaMeta;
  description: string | null;
  blurhash: string;
}

export interface MastodonField {
  name: string;
  value: string;
  verified_at: string | null;
}

export interface MastodonAccount {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  locked: boolean;
  bot: boolean;
  discoverable: boolean;
  indexable: boolean;
  group: boolean;
  created_at: string;
  note: string;
  url: string;
  uri: string;
  avatar: string;
  avatar_static: string;
  header: string;
  header_static: string;
  followers_count: number;
  following_count: number;
  statuses_count: number;
  last_status_at: string;
  hide_collections: boolean;
  noindex: boolean;
  emojis: any[];
  roles: any[];
  fields: MastodonField[];
}

export interface MastodonApplication {
  name: string;
  website: string | null;
}

export interface MastodonStatus {
  id: string;
  created_at: string;
  in_reply_to_id: string | null;
  in_reply_to_account_id: string | null;
  sensitive: boolean;
  spoiler_text: string;
  visibility: "public" | "unlisted" | "private" | "direct";
  language: string;
  uri: string;
  url: string;
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
  edited_at: string | null;
  favourited: boolean;
  reblogged: boolean;
  muted: boolean;
  bookmarked: boolean;
  pinned: boolean;
  content: string;
  filtered: any[];
  reblog: MastodonStatus | null;
  application: MastodonApplication | null;
  account: MastodonAccount;
  media_attachments: MastodonMediaAttachment[];
  mentions: any[];
  tags: any[];
  emojis: any[];
  card: any | null;
  poll: any | null;
}

export interface CreateStatusParams {
  status: string;
  visibility?: "public" | "unlisted" | "private" | "direct";
  sensitive?: boolean;
  spoiler_text?: string;
  language?: string;
  media_ids?: string[];
  poll?: {
    options: string[];
    expires_in: number;
    multiple?: boolean;
    hide_totals?: boolean;
  };
  in_reply_to_id?: string;
}

export interface MastodonError {
  error: string;
}
