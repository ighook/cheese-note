import { openMemoPopup } from "@/src/components/memoPopup";

export default defineContentScript({
  matches: ["https://chzzk.naver.com/*"],

  main() {
    document.addEventListener("keydown", (event) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.hasAttribute("contenteditable");

      if (isTyping || event.key.toLowerCase() !== "g") {
        return;
      }

      event.preventDefault();
      void openMemoPopup();
    });
  },
});
