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
  let response: { memos?: MemoItem[]; error?: string } | undefined;
  try {
    response = await browser.runtime.sendMessage(message);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (/Receiving end does not exist|Extension context invalidated/i.test(reason)) {
      throw new Error("확장 프로그램에 연결할 수 없습니다. 입력한 메모를 복사한 뒤 확장 프로그램을 다시 로드하고 치지직 페이지를 새로고침해주세요.");
    }
    throw error;
  }
  if (!response || (!response.error && !Array.isArray(response.memos))) {
    throw new Error("확장 프로그램에서 올바른 응답을 받지 못했습니다. 다시 시도해주세요.");
  }
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
