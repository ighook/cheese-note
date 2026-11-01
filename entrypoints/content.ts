import { openMemoPopup } from "@/src/components/memoPopup";
import {
  getCurrentChannelId,
  getChannelInfo,
  getLiveSession,
  updateLiveSession,
} from "@/src/stores/liveSession";

export default defineContentScript({
  matches: ["https://chzzk.naver.com/*"],

  main() {
    let activeChannelId = "";
    const captureSession = () => {
      const channelId = getCurrentChannelId();
      if (!channelId) {
        activeChannelId = "";
        updateLiveSession({
          channelId: "",
          channelName: "",
          title: "",
          elapsedSeconds: null,
        });
        return;
      }
      if (activeChannelId !== channelId) activeChannelId = channelId;
      const current = getLiveSession();
      const channelName = getChannelInfo()?.channelName || current?.channelName || "";
      const rawTitle =
        document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const titleChannelName = channelName || rawTitle.split(/\s*[-–—|:]\s*/, 1)[0];
      const title = titleChannelName
        ? rawTitle.replace(
            new RegExp(
              `^${titleChannelName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—|:]\\s*`,
              "i",
            ),
            "",
          )
        : rawTitle;
      const elapsed = [...document.querySelectorAll("span")]
        .map(
          (el) =>
            el.textContent
              ?.trim()
              .match(/(\d{1,2}:\d{2}:\d{2})\s*스트리밍 중/)?.[1],
        )
        .find(Boolean);
      if (!channelName && !title && !elapsed) return;
      const [h = "0", m = "0", s = "0"] = elapsed?.split(":") ?? [];
      updateLiveSession({
        channelId,
        channelName,
        title: title || current?.title || "",
        elapsedSeconds: elapsed
          ? Number(h) * 3600 + Number(m) * 60 + Number(s)
          : null,
      });
    };
    captureSession();
    const sessionObserver = new MutationObserver(captureSession);
    sessionObserver.observe(document, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    window.addEventListener("popstate", captureSession);
    document.addEventListener("keydown", (event) => {
      const activeElement = document.activeElement;
      const target = event.target;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.closest?.('[contenteditable="true"]') ||
        (target instanceof Element &&
          Boolean(target.closest('[contenteditable="true"]')));

      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        isTyping ||
        event.key.toLowerCase() !== "g"
      ) {
        return;
      }

      if (!getCurrentChannelId()) return;
      event.preventDefault();
      void openMemoPopup();
    });
  },
});

