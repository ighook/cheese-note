import { useEffect, useRef, useState } from "react";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { addMemo } from "@/src/stores/memoStorage";
import type {
  ChannelMessageResponse,
  ChzzkChannel,
} from "@/src/types/channel";
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
  }, []);

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
  const pageInfo = getPageInfo();

  closeMemoPopup();

  if (!pageInfo.channelId) {
    window.alert("현재 페이지에서 치지직 채널 ID를 찾을 수 없습니다.");
    return;
  }

  let response: ChannelMessageResponse<ChzzkChannel>;

  try {
    response = await browser.runtime.sendMessage({
      type: "channel:get",
      channelId: pageInfo.channelId,
    });
  } catch {
    window.alert(
      "채널 조회 서비스를 시작할 수 없습니다. 확장프로그램을 다시 로드해 주세요.",
    );
    return;
  }

  if (!response.ok) {
    window.alert(response.error);
    return;
  }

  memoPopupContainer = document.createElement("div");
  document.body.append(memoPopupContainer);
  memoPopupRoot = createRoot(memoPopupContainer);

  memoPopupRoot.render(
    React.createElement(MemoPopup, {
      title: pageInfo.title,
      channelName: response.data.channelName,
      elapsedTime: pageInfo.elapsedTime,
      onClose: closeMemoPopup,
      onSave: async (memo: string) => {
        await addMemo({
          channelId: response.data.channelId,
          channelName: response.data.channelName,
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
  title: string;
  elapsedTime: string;
}

function getPageInfo(): PageInfo {
  const channelId = findChannelId();
  const title =
    document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content")
      ?.trim() ??
    document.title.replace(/\s*[-|]\s*CHZZK.*$/i, "").trim();

  return {
    channelId,
    title,
    elapsedTime: getBroadcastElapsedTime(),
  };
}

function getBroadcastElapsedTime() {
  for (const element of document.querySelectorAll("span")) {
    const elapsedTime = element.textContent
      ?.trim()
      .match(/^(\d+:\d{2}:\d{2})\s*스트리밍 중$/)?.[1];

    if (elapsedTime) {
      return normalizeElapsedTime(elapsedTime);
    }
  }

  const timeSelectors = [
    'span[class*="video_information_count"]',
    '[class*="live_information"] [class*="time"]',
    '[class*="video_information"] [class*="time"]',
  ];

  for (const selector of timeSelectors) {
    for (const element of document.querySelectorAll(selector)) {
      const elapsedTime = element.textContent?.match(/\d+:\d{2}:\d{2}/)?.[0];

      if (elapsedTime) {
        return normalizeElapsedTime(elapsedTime);
      }
    }
  }

  return formatElapsedTime(document.querySelector("video")?.currentTime ?? 0);
}

function findChannelId() {
  const liveMatch = location.pathname.match(/^\/live\/([a-f0-9]{32})(?:\/|$)/i);

  if (liveMatch) {
    return liveMatch[1];
  }

  const channelAnchors = [
    ...document.querySelectorAll<HTMLAnchorElement>(
      '[class*="live_information"] a[href], [class*="video_information"] a[href]',
    ),
    ...document.querySelectorAll<HTMLAnchorElement>("a[href]"),
  ];

  for (const anchor of channelAnchors) {
    const pathname = new URL(anchor.href, location.origin).pathname;
    const channelMatch = pathname.match(/^\/([a-f0-9]{32})(?:\/|$)/i);

    if (channelMatch) {
      return channelMatch[1];
    }
  }

  return "";
}

function formatElapsedTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function normalizeElapsedTime(elapsedTime: string) {
  const [hours, minutes, seconds] = elapsedTime.split(":");

  return [
    hours.padStart(2, "0"),
    minutes.padStart(2, "0"),
    seconds.padStart(2, "0"),
  ].join(":");
}
