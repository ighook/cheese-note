import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMemos } from "@/src/hooks/useMemo";
import type { MemoItem } from "@/src/types/memo";
import styles from "./memoList.module.css";

interface MemoGroup {
  channelName: string;
  memos: MemoItem[];
}

export function MemoList() {
  const { memos, loading, deleteMemo, updateMemo, importMemos, clearMemos } =
    useMemos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collapsedChannels, setCollapsedChannels] = useState<Set<string>>(
    () => new Set()
  );

  const memoGroups = useMemo(() => {
    const groups = new Map<string, MemoGroup>();

    for (const memo of memos) {
      const channelName = memo.channelName || "알 수 없는 채널";
      const group = groups.get(channelName);

      if (group) {
        group.memos.push(memo);
      } else {
        groups.set(channelName, {
          channelName,
          memos: [memo],
        });
      }
    }

    return Array.from(groups.values());
  }, [memos]);

  useEffect(() => {
    setCollapsedChannels((currentChannels) => {
      const nextChannels = new Set<string>();
      const channelNames = new Set(memoGroups.map((group) => group.channelName));

      for (const channelName of currentChannels) {
        if (channelNames.has(channelName)) {
          nextChannels.add(channelName);
        }
      }

      return nextChannels;
    });
  }, [memoGroups]);

  const toggleChannel = (channelName: string) => {
    setCollapsedChannels((currentChannels) => {
      const nextChannels = new Set(currentChannels);

      if (nextChannels.has(channelName)) {
        nextChannels.delete(channelName);
      } else {
        nextChannels.add(channelName);
      }

      return nextChannels;
    });
  };

  const exportMemoList = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      memos,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `chzzk-memos-${formatFileDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openImportFile = () => {
    fileInputRef.current?.click();
  };

  const importMemoList = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);
      const importedMemos = Array.isArray(parsedData)
        ? parsedData
        : parsedData?.memos;

      if (!Array.isArray(importedMemos) || !importedMemos.every(isMemoItem)) {
        window.alert("가져올 수 없는 메모 파일입니다.");
        return;
      }

      await importMemos(importedMemos);
    } catch {
      window.alert("메모 파일을 읽는 중 문제가 발생했습니다.");
    }
  };

  if (loading) {
    return <div className={styles["loading-state"]}>불러오는 중...</div>;
  }

  return (
    <div className={styles["memo-list-container"]}>
      <div className={styles["memo-list-header"]}>
        <span className={styles["memo-count"]}>전체 메모 ({memos.length})</span>
        <div className={styles["memo-list-actions"]}>
          <button
            className={styles["list-action-btn"]}
            type="button"
            onClick={exportMemoList}
            disabled={memos.length === 0}
          >
            내보내기
          </button>
          <button
            className={styles["list-action-btn"]}
            type="button"
            onClick={openImportFile}
          >
            가져오기
          </button>
          <button
            className={styles["clear-all-btn"]}
            type="button"
            onClick={clearMemos}
            disabled={memos.length === 0}
          >
            비우기
          </button>
          <input
            ref={fileInputRef}
            className={styles["memo-import-input"]}
            type="file"
            accept="application/json,.json"
            onChange={importMemoList}
          />
        </div>
      </div>

      {memos.length === 0 ? (
        <div className={styles["empty-state"]}>
          <div className={styles["empty-icon"]}>📝</div>
          <p className={styles["empty-text"]}>저장된 메모가 없습니다.</p>
          <p className={styles["empty-subtext"]}>
            방송 화면에서 'G' 키를 눌러
            <br />
            메모를 추가해 보세요!
          </p>
        </div>
      ) : (
        <div className={styles["memo-cards-scroll"]}>
          {memoGroups.map((group) => {
            const isCollapsed = collapsedChannels.has(group.channelName);

            return (
              <section
                key={group.channelName}
                className={styles["memo-channel-group"]}
              >
                <button
                  className={styles["memo-channel-header"]}
                  type="button"
                  onClick={() => toggleChannel(group.channelName)}
                  aria-expanded={!isCollapsed}
                >
                  <span className={styles["memo-channel-toggle"]}>
                    {isCollapsed ? "▶" : "▼"}
                  </span>
                  <span
                    className={styles["memo-channel-title"]}
                    title={group.channelName}
                  >
                    {group.channelName}
                  </span>
                  <span className={styles["memo-channel-count"]}>
                    {group.memos.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className={styles["memo-group-cards"]}>
                    {group.memos.map((memo: MemoItem) => (
                      <div key={memo.id} className={styles["memo-card"]}>
                        {memo.broadcastTitle && (
                          <div
                            className={styles["memo-broadcast-title"]}
                            title={memo.broadcastTitle}
                          >
                            {memo.broadcastTitle}
                          </div>
                        )}
                        <div className={styles["memo-card-header"]}>
                          <span className={styles["memo-time-badge"]}>
                            {memo.elapsedTime || "00:00:00"}
                          </span>
                          <span className={styles["memo-created-date"]}>
                            {formatMemoDate(memo.createdAt)}
                          </span>
                          <button
                            className={styles["memo-delete-btn"]}
                            onClick={() => deleteMemo(memo.id)}
                            title="삭제"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        <div className={styles["memo-card-body"]}>
                          <MemoTextarea memo={memo} onUpdate={updateMemo} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MemoTextareaProps {
  memo: MemoItem;
  onUpdate: (id: string, text: string) => void | Promise<void>;
}

function MemoTextarea({ memo, onUpdate }: MemoTextareaProps) {
  const [draft, setDraft] = useState(memo.memo);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isComposingRef = useRef(false);
  const latestDraftRef = useRef(memo.memo);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(memo.memo);
      latestDraftRef.current = memo.memo;
    }
  }, [isEditing, memo.id, memo.memo]);

  const startEditing = () => {
    setDraft(memo.memo);
    latestDraftRef.current = memo.memo;
    setIsEditing(true);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(memo.memo.length, memo.memo.length);
    });
  };

  const cancelEditing = () => {
    setDraft(memo.memo);
    latestDraftRef.current = memo.memo;
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (isComposingRef.current) {
      return;
    }

    const nextMemo = latestDraftRef.current;

    try {
      setIsSaving(true);

      if (nextMemo !== memo.memo) {
        await onUpdate(memo.id, nextMemo);
      }

      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <textarea
        ref={textareaRef}
        className={`${styles["memo-textarea"]} ${
          !isEditing ? styles["memo-textarea-readonly"] : ""
        }`}
        value={draft}
        readOnly={!isEditing}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          latestDraftRef.current = nextDraft;
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(event) => {
          isComposingRef.current = false;
          const nextDraft = event.currentTarget.value;
          setDraft(nextDraft);
          latestDraftRef.current = nextDraft;
        }}
        placeholder="메모를 입력하세요..."
        rows={1}
      />
      <div className={styles["memo-edit-actions"]}>
        {isEditing ? (
          <>
            <button
              className={styles["memo-save-btn"]}
              type="button"
              onClick={saveEditing}
              disabled={isSaving}
            >
              저장
            </button>
            <button
              className={styles["memo-cancel-btn"]}
              type="button"
              onClick={cancelEditing}
              disabled={isSaving}
            >
              취소
            </button>
          </>
        ) : (
          <button
            className={styles["memo-edit-btn"]}
            type="button"
            onClick={startEditing}
          >
            수정
          </button>
        )}
      </div>
    </>
  );
}

function isMemoItem(value: unknown): value is MemoItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const memo = value as MemoItem;

  return (
    typeof memo.id === "string" &&
    typeof memo.channelId === "string" &&
    typeof memo.channelName === "string" &&
    (memo.broadcastTitle === undefined ||
      typeof memo.broadcastTitle === "string") &&
    typeof memo.elapsedTime === "string" &&
    typeof memo.memo === "string" &&
    typeof memo.createdAt === "number"
  );
}

function formatMemoDate(createdAt: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(createdAt);
}

function formatFileDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
