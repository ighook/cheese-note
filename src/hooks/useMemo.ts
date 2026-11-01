import { useCallback, useEffect, useState } from "react";
import {
  memoStorage,
  deleteMemo as deleteStoredMemo,
  deleteChannelMemos as deleteStoredChannelMemos,
  getMemos,
  updateMemo as updateStoredMemo,
} from "@/src/stores/memoStorage";
import type { MemoItem } from "@/src/types/memo";

export function useMemos() {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMemos = useCallback(async () => {
    setLoading(true);
    try {
      const savedMemos = await getMemos();
      setMemos(savedMemos);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMemo = useCallback(async (id: string) => {
    const nextMemos = await deleteStoredMemo(id);
    setMemos(nextMemos);
  }, []);

  const deleteChannelMemos = useCallback(async (channelId: string) => {
    setMemos(await deleteStoredChannelMemos(channelId));
  }, []);

  const updateMemo = useCallback(async (id: string, text: string) => {
    const nextMemos = await updateStoredMemo(id, text);
    setMemos(nextMemos);
  }, []);

  useEffect(() => {
    loadMemos();
    return memoStorage.watch((nextMemos) => setMemos(nextMemos ?? []));
  }, [loadMemos]);

  return {
    memos,
    loading,
    loadMemos,
    deleteMemo,
    deleteChannelMemos,
    updateMemo,
  };
}
