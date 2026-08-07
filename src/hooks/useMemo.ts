import { useCallback, useEffect, useState } from "react";
import { memoStorage } from "@/src/stores/memoStorage";
import type { MemoItem } from "@/src/types/memo";

interface CreateMemoParams {
  channelId: string;
  channelName: string;
  broadcastTitle?: string;
  elapsedTime: string;
  memo: string;
}

export function useMemos() {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMemos = useCallback(async () => {
    setLoading(true);
    try {
      const savedMemos = await memoStorage.getValue();
      setMemos(savedMemos);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMemo = useCallback(async (params: CreateMemoParams) => {
    const currentMemos = await memoStorage.getValue();

    const newMemo: MemoItem = {
      id: crypto.randomUUID(),
      channelId: params.channelId,
      channelName: params.channelName,
      broadcastTitle: params.broadcastTitle,
      elapsedTime: params.elapsedTime,
      memo: params.memo,
      createdAt: Date.now(),
    };

    const nextMemos = [newMemo, ...currentMemos];

    await memoStorage.setValue(nextMemos);
    setMemos(nextMemos);

    return newMemo;
  }, []);

  const deleteMemo = useCallback(async (id: string) => {
    const currentMemos = await memoStorage.getValue();
    const nextMemos = currentMemos.filter((memo) => memo.id !== id);

    await memoStorage.setValue(nextMemos);
    setMemos(nextMemos);
  }, []);

  const updateMemo = useCallback(async (id: string, text: string) => {
    const currentMemos = await memoStorage.getValue();
    const nextMemos = currentMemos.map((memo) =>
      memo.id === id ? { ...memo, memo: text } : memo
    );

    await memoStorage.setValue(nextMemos);
    setMemos(nextMemos);
  }, []);

  const clearMemos = useCallback(async () => {
    await memoStorage.setValue([]);
    setMemos([]);
  }, []);

  const importMemos = useCallback(async (nextMemos: MemoItem[]) => {
    await memoStorage.setValue(nextMemos);
    setMemos(nextMemos);
  }, []);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  return {
    memos,
    loading,
    loadMemos,
    addMemo,
    deleteMemo,
    updateMemo,
    importMemos,
    clearMemos,
  };
}
