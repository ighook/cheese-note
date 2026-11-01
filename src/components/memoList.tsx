import { useEffect, useMemo, useState } from "react";
import { useMemos } from "@/src/hooks/useMemo";
import type { MemoItem } from "@/src/types/memo";
import styles from "./memoList.module.css";

const MAX_MEMO_LENGTH = 10_000;

interface MemoGroup {
  channelId: string;
  channelName: string;
  memos: MemoItem[];
}

export function MemoList() {
  const { memos, loading, deleteMemo, deleteChannelMemos, updateMemo } =
    useMemos();
  const [collapsedChannels, setCollapsedChannels] = useState<Set<string>>(
    () => new Set()
  );

  const memoGroups = useMemo(() => {
    const groups = new Map<string, MemoGroup>();

    for (const memo of memos) {
      const channelName = memo.channelName || "알 수 없는 채널";
      const group = groups.get(memo.channelId);

      if (group) {
        group.memos.push(memo);
      } else {
        groups.set(memo.channelId, {
          channelId: memo.channelId,
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
      const channelNames = new Set(memoGroups.map((group) => group.channelId));

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

  if (loading) {
    return <div className={styles["loading-state"]}>불러오는 중...</div>;
  }

  return (
    <div className={styles["memo-list-container"]}>
      <div className={styles["memo-list-header"]}>
        <span className={styles["memo-count"]}>전체 메모 ({memos.length})</span>
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
            const isCollapsed = collapsedChannels.has(group.channelId);

            return (
              <section
                key={group.channelId}
                className={styles["memo-channel-group"]}
              >
                <div className={styles["memo-channel-header"]}>
                  <button className={styles["memo-channel-toggle-button"]} type="button" onClick={() => toggleChannel(group.channelId)} aria-expanded={!isCollapsed}>
                  <span className={styles["memo-channel-toggle"]}>
                    {isCollapsed ? "▶" : "▼"}
                  </span>
                  <span
                    className={styles["memo-channel-title"]}
                    title={group.channelName}
                  >
                    {group.channelName}
                  </span>
                  <span className={styles["memo-channel-count"]}>{group.memos.length}</span>
                  </button>
                  <button
                    className={styles["clear-all-btn"]}
                    type="button"
                    aria-label={`${group.channelName} 메모 전체 삭제`}
                    onClick={() => {
                      if (window.confirm(`${group.channelName}의 메모 ${group.memos.length}개를 모두 삭제할까요?`)) {
                        void deleteChannelMemos(group.channelId);
                      }
                    }}
                  >전체 삭제</button>
                </div>

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
                        <MemoTextarea memo={memo} onUpdate={updateMemo} onDelete={deleteMemo} />
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
  onDelete: (id: string) => void | Promise<void>;
}

function MemoTextarea({ memo, onUpdate, onDelete }: MemoTextareaProps) {
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
      <div className={styles["memo-card-header"]}>
        <span className={styles["memo-time-badge"]}>{memo.elapsedTime || "00:00:00"}</span>
        <span className={styles["memo-created-date"]}>{formatMemoDate(memo.createdAt)}</span>
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
        <button className={styles["memo-delete-btn"]} type="button" onClick={() => onDelete(memo.id)}>
          삭제
        </button>
      </div>
      <div className={styles["memo-card-body"]}>
      <textarea
        ref={textareaRef}
        className={`${styles["memo-textarea"]} ${
          !isEditing ? styles["memo-textarea-readonly"] : ""
        }`}
        value={draft}
        maxLength={MAX_MEMO_LENGTH}
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
      </div>
    </>
  );
}

function formatMemoDate(createdAt: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(createdAt);
}
