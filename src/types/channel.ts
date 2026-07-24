export interface ChzzkChannel {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  followerCount: number;
  verifiedMark: boolean;
}

export interface ChzzkApiCredentials {
  clientId: string;
  clientSecret: string;
}

export type ChannelMessage =
  | { type: "channel:get"; channelId: string }
  | { type: "channel:credentials:get" }
  | {
      type: "channel:credentials:set";
      credentials: ChzzkApiCredentials;
    };

export type ChannelMessageResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
