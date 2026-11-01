import { applyMemoMutation, memoStorage, type MemoMessage } from "@/src/stores/memoStorage";

let mutationQueue: Promise<unknown> = Promise.resolve();

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: MemoMessage, sender, sendResponse) => {
    if (sender.id !== browser.runtime.id || !message?.type?.startsWith("memos:")) return;
    const operation = message.type === "memos:get"
      ? mutationQueue.then(() => memoStorage.getValue())
      : (mutationQueue = mutationQueue.catch(() => undefined).then(() => applyMemoMutation(message.mutation)));
    operation.then(
      (memos) => sendResponse({ memos }),
      () => sendResponse({ error: "메모를 처리하지 못했습니다." }),
    );
    return true;
  });
});
