import { storage } from "wxt/utils/storage";
import type { ChzzkApiCredentials } from "@/src/types/channel";

export const channelCredentialsStorage =
  storage.defineItem<ChzzkApiCredentials>("local:chzzkApiCredentials", {
    fallback: {
      clientId: "",
      clientSecret: "",
    },
  });
