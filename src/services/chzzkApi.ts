import type {
  ChzzkApiCredentials,
  ChzzkChannel,
} from "@/src/types/channel";

const CHZZK_OPEN_API_URL = "https://openapi.chzzk.naver.com/open/v1";
const CHANNEL_ID_PATTERN = /^[a-f0-9]{32}$/i;

interface ChzzkChannelResponse {
  code: number;
  message: string | null;
  content: {
    data: ChzzkChannel[];
  };
}

export class ChzzkApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ChzzkApiError";
  }
}

export async function fetchChannel(
  channelId: string,
  credentials: ChzzkApiCredentials,
): Promise<ChzzkChannel> {
  if (!CHANNEL_ID_PATTERN.test(channelId)) {
    throw new ChzzkApiError("올바른 치지직 채널 ID가 아닙니다.");
  }

  if (!credentials.clientId || !credentials.clientSecret) {
    throw new ChzzkApiError(
      "확장프로그램 팝업에서 치지직 API Client ID와 Client Secret을 설정해 주세요.",
    );
  }

  const url = new URL(`${CHZZK_OPEN_API_URL}/channels`);
  url.searchParams.append("channelIds", channelId);

  const response = await fetch(url, {
    headers: {
      "Client-Id": credentials.clientId,
      "Client-Secret": credentials.clientSecret,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new ChzzkApiError(
      errorBody?.message || `치지직 API 요청에 실패했습니다. (${response.status})`,
      response.status,
    );
  }

  const payload = (await response.json()) as ChzzkChannelResponse;
  const channel = payload.content?.data?.[0];

  if (!channel) {
    throw new ChzzkApiError("채널 정보를 찾을 수 없습니다.", 404);
  }

  return channel;
}
