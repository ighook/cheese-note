import { useCallback, useEffect, useState } from "react";
import {
  clearMemos as clearStoredMemos,
  deleteMemo as deleteStoredMemo,
  getMemos,
  replaceMemos,
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

  const updateMemo = useCallback(async (id: string, text: string) => {
    const nextMemos = await updateStoredMemo(id, text);
    setMemos(nextMemos);
  }, []);

  const clearMemos = useCallback(async () => {
    setMemos(await clearStoredMemos());
  }, []);

  const importMemos = useCallback(async (nextMemos: MemoItem[]) => {
    setMemos(await replaceMemos(nextMemos));
  }, []);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  return {
    memos,
    loading,
    loadMemos,
    deleteMemo,
    updateMemo,
    importMemos,
    clearMemos,
  };
}
