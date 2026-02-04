"use client";

import { useMemo, useRef, useState } from "react";

const MIN_PANES = 2;
const MAX_PANES = 4;

const createPane = (id) => ({
  id,
  url: "",
  input: "",
  muted: false,
});

const normalizeUrl = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const getMutedUrl = (url, muted) => {
  if (!muted || !url) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      parsed.searchParams.set("mute", "1");
      if (!parsed.searchParams.has("autoplay")) {
        parsed.searchParams.set("autoplay", "1");
      }
      return parsed.toString();
    }
    if (host.includes("vimeo.com")) {
      parsed.searchParams.set("muted", "1");
      return parsed.toString();
    }
    return url;
  } catch (error) {
    return url;
  }
};

const muteSupportHint = (url) => {
  if (!url) return "";
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com")) {
      return "";
    }
    return "Some sites may block programmatic mute due to browser security.";
  } catch (error) {
    return "";
  }
};

export default function HomePage() {
  const [paneCount, setPaneCount] = useState(null);
  const [panes, setPanes] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);
  const idCounter = useRef(1);

  const activeCount = paneCount ?? 0;

  const gridClass = useMemo(() => {
    if (!activeCount) return "";
    return `panel-grid cols-${activeCount}`;
  }, [activeCount]);

  const startSplit = (count) => {
    const nextPanes = Array.from({ length: count }, () => createPane(idCounter.current++));
    setPaneCount(count);
    setPanes(nextPanes);
  };

  const updatePane = (id, updates) => {
    setPanes((prev) => prev.map((pane) => (pane.id === id ? { ...pane, ...updates } : pane)));
  };

  const handleSubmit = (event, id) => {
    event.preventDefault();
    const target = panes.find((pane) => pane.id === id);
    if (!target) return;
    const normalized = normalizeUrl(target.input || target.url);
    if (!normalized) return;
    updatePane(id, { url: normalized, input: normalized });
  };

  const handleClose = (id) => {
    setPanes((prev) => {
      const next = prev.filter((pane) => pane.id !== id);
      if (next.length === 0) {
        setPaneCount(null);
      } else if (paneCount && next.length !== paneCount) {
        setPaneCount(next.length);
      }
      return next;
    });
    setReloadToken((prev) => prev + 1);
  };

  const toggleMute = (id) => {
    setPanes((prev) =>
      prev.map((pane) => (pane.id === id ? { ...pane, muted: !pane.muted } : pane))
    );
  };

  return (
    <div>
      {!paneCount && (
        <section className="hero">
          <div className="hero-card">
            <p className="hero-title">Split your focus. Multiply your tabs.</p>
            <p className="hero-text">
              MSB lets you divide your screen into focused vertical panels. Pick how many screens you need, then
              drop in the URLs you want to watch side-by-side.
            </p>
            <div className="split-choices">
              {Array.from({ length: MAX_PANES - MIN_PANES + 1 }, (_, index) => {
                const count = MIN_PANES + index;
                return (
                  <button key={count} className="choice-btn" type="button" onClick={() => startSplit(count)}>
                    Split into {count}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="hero-panel">
            <h3>What you get</h3>
            <ul>
              <li>Vertical splits from 2 to 4 panels.</li>
              <li>Quick URL entry per panel.</li>
              <li>Drag panel edges to resize each screen.</li>
              <li>Close and reflow panels instantly.</li>
              <li>Per-panel mute toggles.</li>
            </ul>
          </div>
        </section>
      )}

      {paneCount && (
        <section className={gridClass}>
          {panes.map((pane) => {
            const src = getMutedUrl(pane.url, pane.muted);
            const muteHint = pane.muted ? muteSupportHint(pane.url) : "";
            return (
              <div key={`${pane.id}-${reloadToken}-${pane.muted}`} className="panel">
                <form className="panel-header" onSubmit={(event) => handleSubmit(event, pane.id)}>
                  <input
                    className="url-input"
                    type="text"
                    placeholder="Enter a web address"
                    value={pane.input}
                    onChange={(event) => updatePane(pane.id, { input: event.target.value })}
                  />
                  <button className="action-btn" type="submit">
                    Go
                  </button>
                  <button className="action-btn" type="button" onClick={() => toggleMute(pane.id)}>
                    {pane.muted ? "Unmute" : "Mute"}
                  </button>
                  <button className="action-btn danger" type="button" onClick={() => handleClose(pane.id)}>
                    Close
                  </button>
                  {pane.muted && <span className="muted-indicator">Muted</span>}
                </form>
                <div className="panel-body">
                  {pane.url ? (
                    <iframe
                      key={`${pane.id}-${reloadToken}-${pane.muted}`}
                      className="iframe"
                      title={`panel-${pane.id}`}
                      src={src}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="panel-placeholder">Add a URL to load this panel.</div>
                  )}
                </div>
                {muteHint && <div className="mute-note">{muteHint}</div>}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
