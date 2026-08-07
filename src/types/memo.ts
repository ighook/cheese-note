export interface MemoItem {
  id: string;
  channelId: string;
  channelName: string;
  broadcastTitle?: string;
  elapsedTime: string;
  memo: string;
  createdAt: number;
}

export type CreateMemoItem = Omit<MemoItem, "id" | "createdAt">;
