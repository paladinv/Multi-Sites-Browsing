"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MIN_PANES = 2;
const MAX_PANES = 4;

const createPane = (id) => ({
  id,
  url: "",
  input: "",
  muted: false,
  zoom: 1,
  width: null,
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
  const gridRef = useRef(null);

  useEffect(() => {
    if (!paneCount || !gridRef.current) return;
    const gap = 18;
    const totalWidth = gridRef.current.clientWidth;
    if (!totalWidth) return;
    const available = totalWidth - gap * (paneCount - 1);
    const baseWidth = Math.max(280, Math.floor(available / paneCount));
    setPanes((prev) =>
      prev.map((pane) => (pane.width ? pane : { ...pane, width: baseWidth }))
    );
  }, [paneCount, panes.length]);

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

  const adjustZoom = (id, delta) => {
    setPanes((prev) =>
      prev.map((pane) => {
        if (pane.id !== id) return pane;
        const next = Math.min(2, Math.max(0.5, Number((pane.zoom + delta).toFixed(2))));
        return { ...pane, zoom: next };
      })
    );
  };

  const resetZoom = (id) => {
    updatePane(id, { zoom: 1 });
  };

  const openInNewTab = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const startResize = (id, event) => {
    event.preventDefault();
    event.stopPropagation();
    const pane = panes.find((item) => item.id === id);
    if (!pane) return;
    const startX = event.clientX;
    const startWidth =
      pane.width ||
      event.currentTarget.closest(".panel")?.getBoundingClientRect().width ||
      320;

    const onMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = Math.max(260, Math.round(startWidth + delta));
      updatePane(id, { width: nextWidth });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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
              <li>Per-panel zoom controls.</li>
            </ul>
          </div>
        </section>
      )}

      {paneCount && (
        <section className={gridClass} ref={gridRef}>
          {panes.map((pane) => {
            const src = getMutedUrl(pane.url, pane.muted);
            const muteHint = pane.muted ? muteSupportHint(pane.url) : "";
            return (
              <div
                key={`${pane.id}-${reloadToken}-${pane.muted}`}
                className="panel"
                style={pane.width ? { width: `${pane.width}px` } : undefined}
              >
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
                  <button
                    className="action-btn"
                    type="button"
                    onClick={() => openInNewTab(pane.url)}
                    disabled={!pane.url}
                  >
                    Open
                  </button>
                  <button className="action-btn" type="button" onClick={() => toggleMute(pane.id)}>
                    {pane.muted ? "Unmute" : "Mute"}
                  </button>
                  <button className="action-btn danger" type="button" onClick={() => handleClose(pane.id)}>
                    Close
                  </button>
                  {pane.muted && <span className="muted-indicator">Muted</span>}
                </form>
                <div className="panel-zoom">
                  <span className="zoom-label">Zoom</span>
                  <button className="zoom-btn" type="button" onClick={() => adjustZoom(pane.id, -0.1)}>
                    -
                  </button>
                  <button className="zoom-btn" type="button" onClick={() => resetZoom(pane.id)}>
                    {Math.round(pane.zoom * 100)}%
                  </button>
                  <button className="zoom-btn" type="button" onClick={() => adjustZoom(pane.id, 0.1)}>
                    +
                  </button>
                </div>
                <div className="panel-body">
                  {pane.url ? (
                    <div className="iframe-wrap">
                      <div
                        className="iframe-zoom"
                        style={{
                          transform: `scale(${pane.zoom})`,
                          width: `${100 / pane.zoom}%`,
                          height: `${100 / pane.zoom}%`,
                        }}
                      >
                        <iframe
                          key={`${pane.id}-${reloadToken}-${pane.muted}`}
                          className="iframe"
                          title={`panel-${pane.id}`}
                          src={src}
                          allow="autoplay; encrypted-media; picture-in-picture"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="panel-placeholder">Add a URL to load this panel.</div>
                  )}
                </div>
                <div className="panel-footer">
                  <span>
                    If a site blocks embedding, use <strong>Open</strong> to launch it in a new tab.
                  </span>
                  {muteHint && <span className="mute-note">{muteHint}</span>}
                </div>
                <div
                  className="panel-resizer"
                  role="presentation"
                  onPointerDown={(event) => startResize(pane.id, event)}
                />
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
