import { storage } from "wxt/utils/storage";
import type { CreateMemoItem, MemoItem } from "@/src/types/memo";

export const memoStorage = storage.defineItem<MemoItem[]>("local:memos", {
  fallback: [],
});

type MemoMutation =
  | { type: "add"; memo: CreateMemoItem }
  | { type: "delete"; id: string }
  | { type: "deleteChannel"; channelId: string }
  | { type: "update"; id: string; text: string };

export type MemoMessage = { type: "memos:get" } | { type: "memos:mutate"; mutation: MemoMutation };

export async function applyMemoMutation(mutation: MemoMutation): Promise<MemoItem[]> {
  const memos = await memoStorage.getValue();
  let nextMemos: MemoItem[];
  if (mutation.type === "add") {
    nextMemos = [{ ...mutation.memo, id: crypto.randomUUID(), createdAt: Date.now() }, ...memos];
  } else if (mutation.type === "delete") {
    nextMemos = memos.filter((memo) => memo.id !== mutation.id);
  } else if (mutation.type === "deleteChannel") {
    nextMemos = memos.filter((memo) => memo.channelId !== mutation.channelId);
  } else {
    nextMemos = memos.map((memo) => memo.id === mutation.id ? { ...memo, memo: mutation.text } : memo);
  }
  await memoStorage.setValue(nextMemos);
  return nextMemos;
}

async function sendMessage(message: MemoMessage): Promise<MemoItem[]> {
  const response = await browser.runtime.sendMessage(message) as { memos?: MemoItem[]; error?: string };
  if (response.error) throw new Error(response.error);
  return response.memos ?? [];
}

export async function addMemo(memo: CreateMemoItem): Promise<MemoItem> {
  const memos = await sendMessage({ type: "memos:mutate", mutation: { type: "add", memo } });
  return memos[0];
}

export function deleteMemo(id: string): Promise<MemoItem[]> {
  return sendMessage({ type: "memos:mutate", mutation: { type: "delete", id } });
}

export function deleteChannelMemos(channelId: string): Promise<MemoItem[]> {
  return sendMessage({ type: "memos:mutate", mutation: { type: "deleteChannel", channelId } });
}

export function updateMemo(id: string, text: string): Promise<MemoItem[]> {
  return sendMessage({ type: "memos:mutate", mutation: { type: "update", id, text } });
}

export async function getMemos(): Promise<MemoItem[]> {
  return sendMessage({ type: "memos:get" });
}
