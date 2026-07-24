import { fetchChannel } from "@/src/services/chzzkApi";
import { channelCredentialsStorage } from "@/src/stores/channelStorage";
import type {
  ChannelMessage,
  ChannelMessageResponse,
  ChzzkApiCredentials,
  ChzzkChannel,
} from "@/src/types/channel";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (
      message: ChannelMessage,
      _sender,
      sendResponse: (
        response: ChannelMessageResponse<
          ChzzkChannel | ChzzkApiCredentials | null
        >,
      ) => void,
    ) => {
      void handleMessage(message)
        .then((data) => sendResponse({ ok: true, data }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "알 수 없는 오류가 발생했습니다.",
          }),
        );

      return true;
    },
  );
});

async function handleMessage(message: ChannelMessage) {
  switch (message.type) {
    case "channel:get":
      return fetchChannel(
        message.channelId,
        await channelCredentialsStorage.getValue(),
      );
    case "channel:credentials:get":
      return channelCredentialsStorage.getValue();
    case "channel:credentials:set": {
      const credentials = {
        clientId: message.credentials.clientId.trim(),
        clientSecret: message.credentials.clientSecret.trim(),
      };
      await channelCredentialsStorage.setValue(credentials);
      return credentials;
    }
    default:
      throw new Error("지원하지 않는 확장프로그램 메시지입니다.");
  }
}
