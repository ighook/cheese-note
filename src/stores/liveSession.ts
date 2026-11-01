export interface LiveSessionSnapshot {
  channelId: string;
  channelName: string;
  title: string;
  elapsedSeconds: number;
  capturedAt: number;
}

let session: LiveSessionSnapshot | null = null;

export function getChannelInfo(): { channelId: string; channelName: string } | null {
  const channelId = getCurrentChannelId();
  if (!channelId) return null;

  const name = Array.from(document.querySelectorAll(`a[href="/${channelId}"] span[class*="_text_"]`))
    .map((element) => element.textContent?.trim())
    .find(Boolean);
  return name ? { channelId, channelName: name } : null;
}

export function updateLiveSession(info: Omit<LiveSessionSnapshot, "capturedAt">) {
  if (!info.channelId) {
    session = null;
    return;
  }
  session = { ...info, capturedAt: Date.now() };
}

export function getLiveSession(): LiveSessionSnapshot | null {
  if (!session || session.channelId !== getCurrentChannelId()) return null;
  return { ...session, elapsedSeconds: session.elapsedSeconds + Math.floor((Date.now() - session.capturedAt) / 1000) };
}

export function getCurrentChannelId(): string {
  return location.pathname.match(/^\/live\/([a-f0-9]{32})(?:\/|$)/i)?.[1] ?? "";
}
