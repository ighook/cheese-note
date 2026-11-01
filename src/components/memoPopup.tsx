import { useEffect, useRef, useState } from "react";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { addMemo } from "@/src/stores/memoStorage";
import { getChannelInfo, getCurrentChannelId, getLiveSession } from "@/src/stores/liveSession";
import styles from "./memoPopup.module.css";

interface MemoPopupProps {
  channelName: string;
  elapsedTime: string;
  title: string;
  onClose: () => void;
  onSave: (memo: string) => void | Promise<void>;
}

export function MemoPopup({
  channelName,
  elapsedTime,
  title,
  onClose,
  onSave,
}: MemoPopupProps) {
  const [memo, setMemo] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    const trimmedMemo = memo.trim();

    if (!trimmedMemo) {
      return;
    }

    await onSave(trimmedMemo);
  };

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles["meta-line"]}>
            <span className={styles.time}>{elapsedTime || "00:00:00"}</span>
            <span className={styles.channel}>
              {channelName || "Unknown channel"}
            </span>
          </div>
          <button
            className={styles["close-button"]}
            type="button"
            onClick={onClose}
          >
            x
          </button>
        </div>
        {title && <div className={styles.title}>{title}</div>}
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={memo}
          maxLength={10_000}
          placeholder="메모를 입력해주세요."
          rows={1}
          onChange={(event) => setMemo(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSave();
            }
          }}
        />
        <div className={styles.actions}>
          <button
            className={styles["cancel-button"]}
            type="button"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className={styles["save-button"]}
            type="button"
            disabled={!memo.trim()}
            onClick={() => void handleSave()}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

let memoPopupRoot: Root | null = null;
let memoPopupContainer: HTMLDivElement | null = null;

export async function openMemoPopup() {
  if (!getCurrentChannelId()) return;
  const session = getLiveSession();
  const pageInfo = session
    ? {
        channelId: session.channelId,
        channelName: getChannelInfo()?.channelName || session.channelName,
        title: session.title,
        elapsedTime: formatElapsedTime(session.elapsedSeconds),
      }
    : getPageInfo();

  closeMemoPopup();

  if (!pageInfo.channelId) {
    window.alert("현재 라이브 페이지에서 치지직 채널 ID를 찾을 수 없습니다.");
    return;
  }

  if (!pageInfo.channelName) {
    window.alert("현재 라이브 페이지에서 스트리머 이름을 찾을 수 없습니다.");
    return;
  }

  if (!pageInfo.elapsedTime) {
    window.alert("현재 라이브 페이지에서 방송 시간을 찾을 수 없습니다.");
    return;
  }

  memoPopupContainer = document.createElement("div");
  document.body.append(memoPopupContainer);
  memoPopupRoot = createRoot(memoPopupContainer);

  memoPopupRoot.render(
    React.createElement(MemoPopup, {
      title: pageInfo.title,
      channelName: pageInfo.channelName,
      elapsedTime: pageInfo.elapsedTime,
      onClose: closeMemoPopup,
      onSave: async (memo: string) => {
        await addMemo({
          channelId: pageInfo.channelId,
          channelName: pageInfo.channelName,
          broadcastTitle: pageInfo.title,
          elapsedTime: pageInfo.elapsedTime,
          memo,
        });
        closeMemoPopup();
      },
    }),
  );
}

function closeMemoPopup() {
  memoPopupRoot?.unmount();
  memoPopupRoot = null;
  memoPopupContainer?.remove();
  memoPopupContainer = null;
}

interface PageInfo {
  channelId: string;
  channelName: string;
  title: string;
  elapsedTime: string;
}

function getPageInfo(): PageInfo {
  const channelId = getCurrentChannelId();
  const rawTitle =
    document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content")
      ?.trim() ?? document.title.replace(/\s*[-|]\s*CHZZK.*$/i, "").trim();
  const channelName = getChannelInfo()?.channelName ?? "";
  const title = stripChannelPrefix(rawTitle, channelName);

  return {
    channelId,
    channelName,
    title,
    elapsedTime: getBroadcastElapsedTime(),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripChannelPrefix(title: string, channelName: string): string {
  const normalizedTitle = title.trim();
  if (channelName) {
    const escapedChannelName = escapeRegExp(channelName.trim());
    const channelPrefix = new RegExp(
      `^${escapedChannelName}\\s*[-–—|:]\\s*`,
      "i",
    );
    if (channelPrefix.test(normalizedTitle)) {
      return normalizedTitle.replace(channelPrefix, "").trim();
    }
  }

  return normalizedTitle.replace(/^.+?\\s+[-–—|:]\\s+/, "").trim();
}

function getBroadcastElapsedTime(): string {
  for (const element of document.querySelectorAll("span")) {
    const elapsedTime = element.textContent
      ?.trim()
      .match(/(\d{1,2}:\d{2}:\d{2})\s*스트리밍 중/)?.[1];

    if (elapsedTime) {
      return normalizeElapsedTime(elapsedTime);
    }
  }

  return "";
}

function normalizeElapsedTime(elapsedTime: string) {
  const [hours, minutes, seconds] = elapsedTime.split(":");

  return [
    hours.padStart(2, "0"),
    minutes.padStart(2, "0"),
    seconds.padStart(2, "0"),
  ].join(":");
}

function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
