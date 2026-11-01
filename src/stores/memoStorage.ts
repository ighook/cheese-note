import { storage } from "wxt/utils/storage";
import type { CreateMemoItem, MemoItem } from "@/src/types/memo";

export const memoStorage = storage.defineItem<MemoItem[]>("local:memos", {
  fallback: [],
});

let mutationQueue: Promise<void> = Promise.resolve();

function enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
  const task = mutationQueue.then(operation);
  mutationQueue = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

async function updateMemos(
  updater: (memos: MemoItem[]) => MemoItem[],
): Promise<MemoItem[]> {
  return enqueueMutation(async () => {
    const nextMemos = updater(await memoStorage.getValue());
    await memoStorage.setValue(nextMemos);
    return nextMemos;
  });
}

export async function addMemo(memo: CreateMemoItem): Promise<MemoItem> {
  const newMemo: MemoItem = {
    ...memo,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  await updateMemos((currentMemos) => [newMemo, ...currentMemos]);
  return newMemo;
}

export function deleteMemo(id: string): Promise<MemoItem[]> {
  return updateMemos((memos) => memos.filter((memo) => memo.id !== id));
}

export function clearMemos(): Promise<MemoItem[]> {
  return updateMemos(() => []);
}

export function updateMemo(id: string, text: string): Promise<MemoItem[]> {
  return updateMemos((memos) =>
    memos.map((memo) => (memo.id === id ? { ...memo, memo: text } : memo)),
  );
}

export function replaceMemos(memos: MemoItem[]): Promise<MemoItem[]> {
  return updateMemos(() => memos);
}

export async function getMemos(): Promise<MemoItem[]> {
  await mutationQueue;
  return memoStorage.getValue();
}
