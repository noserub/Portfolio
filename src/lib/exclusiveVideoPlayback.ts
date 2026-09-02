const videos = new Set<HTMLVideoElement>();
const listeners = new Set<(key: string | null) => void>();
let activeKey: string | null = null;
let visibilityBound = false;

function notifyActiveKey() {
  for (const listener of listeners) {
    listener(activeKey);
  }
}

function pauseOthers(except?: HTMLVideoElement) {
  for (const other of videos) {
    if (other === except) continue;
    if (!other.paused) other.pause();
  }
}

function pauseAllVideos() {
  for (const el of videos) {
    if (!el.paused) el.pause();
  }
}

function bindVisibilityPause() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      pauseAllExclusiveMedia();
    }
  });
}

export function activateExclusiveMedia(key: string) {
  bindVisibilityPause();
  if (activeKey === key) {
    pauseOthers();
    return;
  }
  activeKey = key;
  pauseOthers();
  notifyActiveKey();
}

export function releaseExclusiveMedia(key: string) {
  if (activeKey !== key) return;
  activeKey = null;
  notifyActiveKey();
}

export function pauseAllExclusiveMedia() {
  pauseAllVideos();
  if (activeKey === null) return;
  activeKey = null;
  notifyActiveKey();
}

export function subscribeExclusiveMedia(listener: (key: string | null) => void): () => void {
  listeners.add(listener);
  listener(activeKey);
  return () => {
    listeners.delete(listener);
  };
}

export function registerExclusiveVideo(el: HTMLVideoElement, key: string): () => void {
  bindVisibilityPause();
  videos.add(el);

  const claim = () => {
    if (activeKey !== key) {
      activeKey = key;
      notifyActiveKey();
    }
    pauseOthers(el);
  };

  const onPlay = () => {
    claim();
  };

  const onVolumeChange = () => {
    if (!el.muted && el.volume > 0) {
      claim();
    }
  };

  el.addEventListener("play", onPlay);
  el.addEventListener("volumechange", onVolumeChange);

  return () => {
    el.removeEventListener("play", onPlay);
    el.removeEventListener("volumechange", onVolumeChange);
    videos.delete(el);
    if (activeKey === key) {
      activeKey = null;
      notifyActiveKey();
    }
  };
}
