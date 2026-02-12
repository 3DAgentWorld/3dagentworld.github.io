(() => {
  window.__LONGSTREAM_DEMO_OK = true;

  const els = {
    scenePicker: document.getElementById("scene-picker"),
    togglePlay: document.getElementById("toggle-play"),
    pointSize: document.getElementById("point-size"),
    framePointSize: document.getElementById("frame-point-size"),
    resetView: document.getElementById("reset-view"),

    stage: document.querySelector(".media-stage"),

    segButtons: Array.from(document.querySelectorAll(".seg-btn[data-view]")),

    videoRender: document.getElementById("video-render"),
    videoInput: document.getElementById("video-input"),
    videoDepth: document.getElementById("video-depth"),

    viewerWrap: document.getElementById("pc-viewer"),
    viewerStatus: document.getElementById("viewer-status"),
    viewerCanvas: document.getElementById("viewer-canvas"),

    frameViewerWrap: document.getElementById("frame-viewer"),
    frameViewerStatus: document.getElementById("frame-viewer-status"),
    frameViewerCanvas: document.getElementById("frame-viewer-canvas"),

    frameSlider: document.getElementById("frame-slider"),
    frameLabel: document.getElementById("frame-label"),
    openFrame3d: document.getElementById("open-frame-3d"),
    downloadFrame: document.getElementById("download-frame"),
  };

  if (!els.videoRender || !els.videoInput || !els.videoDepth || !els.frameSlider) return;

  const videos = [els.videoRender, els.videoInput, els.videoDepth];

  const pad = (n, digits) => String(n).padStart(digits, "0");

  const defaultManifest = {
    version: 1,
    scenes: [
      {
        id: "kitti",
        name: "KITTI",
        base: "./example/kitti/",
        videos: { input: "input.mp4", render: "render.mp4", depth: "depth.mp4" },
        pointcloud: {
          full: "pt.ply",
          fullPreview: "pt_preview.ply",
          perFrameDir: "per_frame_points/",
          frameStart: 0,
          frameEnd: 550,
          frameDigits: 4,
          framePrefix: "frame_",
          frameSuffix: "_points.ply",
          flipY: true,
        },
        teaser: "./static/images/teaser-user.png",
        thumb: "./example/kitti/thumb.jpg",
      },
      {
        id: "vkitti",
        name: "vKITTI",
        base: "./example/vkitti/",
        videos: { input: "input.mp4", render: "render.mp4", depth: "depth.mp4" },
        pointcloud: {
          perFrameDir: "per_frame_points/",
          frameStart: 0,
          frameEnd: 446,
          frameDigits: 4,
          framePrefix: "frame_",
          frameSuffix: "_points.ply",
          flipY: true,
        },
        teaser: "./static/images/teaser-user.png",
        thumb: "./example/vkitti/thumb.jpg",
      },
      {
        id: "waymo",
        name: "Waymo",
        base: "./example/waymo/",
        videos: { input: "input.mp4", render: "render.mp4", depth: "depth.mp4" },
        pointcloud: {
          perFrameDir: "per_frame_points/",
          frameStart: 0,
          frameEnd: 195,
          frameDigits: 4,
          framePrefix: "frame_",
          frameSuffix: "_points.ply",
          flipY: true,
        },
        teaser: "./static/images/teaser-user.png",
        thumb: "./example/waymo/thumb.jpg",
      },
      {
        id: "waymo2",
        name: "Waymo2",
        base: "./example/waymo2/",
        videos: { input: "input.mp4", render: "render.mp4", depth: "depth.mp4" },
        pointcloud: {
          full: "frame0000_camera0000.ply",
          fullPreview: "frame0000_camera0000_preview.ply",
          perFrameDir: "per_frame_points/",
          frameStart: 0,
          frameEnd: 197,
          frameDigits: 4,
          framePrefix: "frame_",
          frameSuffix: "_points.ply",
          flipY: true,
        },
        teaser: "./static/images/teaser-user.png",
        thumb: "./example/waymo2/thumb.jpg",
      },
    ],
  };

  const state = {
    manifest: defaultManifest,
    scene: defaultManifest.scenes[0],
    view: "render",
    globalViewer: null,
    frameViewer: null,
    frameLoadTimer: 0,
    renderSrc: { candidates: [], idx: 0 },
    globalLoadedUrl: "",
  };

  const urlFromPage = (relativePath) => new URL(relativePath, window.location.href).href;

  const sceneUrl = (scene, relativePath) => urlFromPage(`${scene.base}${relativePath}`);

  const renderCandidatesForScene = (scene) => {
    const raw = scene?.videos?.render;
    if (!raw) return [];
    const candidates = [];
    if (typeof raw === "string" && raw.toLowerCase().endsWith(".mp4") && !raw.toLowerCase().includes("_h264")) {
      candidates.push(raw.replace(/\.mp4$/i, "_h264.mp4"));
    }
    candidates.push(raw);
    return candidates.map((p) => sceneUrl(scene, p));
  };

  const frameFileName = (scene, frameIndex) => {
    const pc = scene.pointcloud;
    return `${pc.framePrefix}${pad(frameIndex, pc.frameDigits)}${pc.frameSuffix}`;
  };

  const frameUrl = (scene, frameIndex) => {
    const pc = scene.pointcloud;
    return sceneUrl(scene, `${pc.perFrameDir}${frameFileName(scene, frameIndex)}`);
  };

  const safePlay = async (video) => {
    try {
      await video.play();
      return true;
    } catch {
      return false;
    }
  };

  const playAll = async () => {
    videos.forEach((v) => (v.muted = true));
    const results = await Promise.all(videos.map(safePlay));
    updatePlayButton();
    return results.every(Boolean);
  };

  const pauseAll = () => {
    videos.forEach((v) => v.pause());
    updatePlayButton();
  };

  const anyPaused = () => videos.some((v) => v.paused);

  const updatePlayButton = () => {
    if (!els.togglePlay) return;
    els.togglePlay.textContent = anyPaused() ? "Play" : "Pause";
  };

  const setActiveSeg = (view) => {
    state.view = view;
    for (const btn of els.segButtons) {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    }
  };

  const showRender = async () => {
    setActiveSeg("render");
    els.stage?.classList.remove("is-viewer");
    els.videoRender.hidden = false;
    if (els.viewerWrap) els.viewerWrap.hidden = true;
    await playAll();
  };

  const ensureGlobalViewer = async () => {
    if (state.globalViewer) return state.globalViewer;
    try {
      const mod = await import("./pc_viewer.js");
      state.globalViewer = new mod.PointCloudViewer({ mountEl: els.viewerCanvas, statusEl: els.viewerStatus });
      await state.globalViewer.init();
      state.globalViewer.setPointSize(Number(els.pointSize?.value ?? 0.05));
      return state.globalViewer;
    } catch (err) {
      if (els.viewerStatus) {
        const hint = "3D viewer failed to load. Please open this page via http(s) (not file://) and ensure network access.";
        els.viewerStatus.textContent = `${hint}`;
      }
      throw err;
    }
  };

  const showGlobal = async () => {
    setActiveSeg("viewer");
    pauseAll();
    els.stage?.classList.add("is-viewer");
    els.videoRender.hidden = true;
    if (els.viewerWrap) els.viewerWrap.hidden = false;
    return ensureGlobalViewer();
  };

  const currentFrameIndex = () => {
    const raw = Number(els.frameSlider.value);
    return Number.isFinite(raw) ? raw : state.scene.pointcloud.frameStart;
  };

  const updateFrameUI = () => {
    const frameIdx = currentFrameIndex();
    if (els.frameLabel) els.frameLabel.textContent = pad(frameIdx, state.scene.pointcloud.frameDigits);
    if (els.downloadFrame) {
      const href = frameUrl(state.scene, frameIdx);
      els.downloadFrame.href = href;
    }
  };

  const ensureFrameViewer = async () => {
    if (!els.frameViewerCanvas) return null;
    if (state.frameViewer) return state.frameViewer;

    try {
      const mod = await import("./pc_viewer.js");
      state.frameViewer = new mod.PointCloudViewer({ mountEl: els.frameViewerCanvas, statusEl: els.frameViewerStatus });
      await state.frameViewer.init();
      state.frameViewer.setPointSize(Number(els.framePointSize?.value ?? 0.05));
      return state.frameViewer;
    } catch (err) {
      if (els.frameViewerStatus) {
        els.frameViewerStatus.textContent =
          "Per-frame viewer failed to load. Please open via http(s) and ensure network access.";
      }
      throw err;
    }
  };

  const hasGlobalPointCloud = (scene) => Boolean(scene?.pointcloud?.fullPreview || scene?.pointcloud?.full);

  const globalPointCloudPath = (scene) => scene?.pointcloud?.fullPreview || scene?.pointcloud?.full || "";

  const loadGlobalPointCloud = async () => {
    if (!hasGlobalPointCloud(state.scene)) return;
    const pc = state.scene.pointcloud;
    const globalPath = globalPointCloudPath(state.scene);
    const url = sceneUrl(state.scene, globalPath);
    if (url && url === state.globalLoadedUrl) {
      const viewer = await showGlobal();
      viewer.setPointSize(Number(els.pointSize?.value ?? 0.05));
      if (els.viewerStatus?.textContent?.trim() === "Loading global point cloud…") {
        els.viewerStatus.textContent = "Global point cloud ready";
      }
      return;
    }

    try {
      const viewer = await showGlobal();
      viewer.setPointSize(Number(els.pointSize?.value ?? 0.05));
      if (pc.fullPreview && globalPath === pc.fullPreview && els.viewerStatus) {
        els.viewerStatus.textContent = "Loading global point cloud (preview)…";
      }
      let count;
      try {
        count = await viewer.loadPly(url, { flipY: pc.flipY ?? true });
        state.globalLoadedUrl = url;
      } catch (err) {
        const canFallback = Boolean(pc.full && pc.fullPreview && globalPath === pc.fullPreview);
        if (!canFallback) throw err;
        const fullUrl = sceneUrl(state.scene, pc.full);
        count = await viewer.loadPly(fullUrl, { flipY: pc.flipY ?? true });
        state.globalLoadedUrl = fullUrl;
      }
      if (els.viewerStatus && Number.isFinite(count)) {
        const usingPreview = Boolean(pc.fullPreview && state.globalLoadedUrl.endsWith(pc.fullPreview));
        const label = usingPreview ? "Global (preview)" : "Global";
        els.viewerStatus.textContent = `${label} · ${Number(count).toLocaleString()} points`;
      }
    } catch (err) {
      if (els.viewerStatus) {
        els.viewerStatus.textContent = "Failed to load global point cloud. Check console/network and file paths.";
      }
    }
  };

  const isFrameViewerOpen = () => Boolean(els.frameViewerWrap && !els.frameViewerWrap.hidden);

  const setFrameViewerOpen = async (open) => {
    if (!els.frameViewerWrap) return;
    els.frameViewerWrap.hidden = !open;
    if (els.openFrame3d) els.openFrame3d.textContent = open ? "Hide (3D)" : "Preview (3D)";
    if (!open) return;
    await loadCurrentFrameInFrameViewer();
  };

  const loadCurrentFrameInFrameViewer = async () => {
    try {
      const viewer = await ensureFrameViewer();
      if (!viewer) return;
      const frameIdx = currentFrameIndex();
      const count = await viewer.loadPly(frameUrl(state.scene, frameIdx), { flipY: state.scene.pointcloud.flipY ?? true });
      if (els.frameViewerStatus && Number.isFinite(count)) {
        const frameLabel = pad(frameIdx, state.scene.pointcloud.frameDigits);
        els.frameViewerStatus.textContent = `Frame ${frameLabel} · ${Number(count).toLocaleString()} points`;
      }
    } catch (err) {
      if (els.frameViewerStatus) {
        els.frameViewerStatus.textContent = "Failed to load frame point cloud. Check console/network and file paths.";
      }
    }
  };

  const setScene = async (scene) => {
    state.scene = scene;

    if (els.scenePicker) {
      const cards = Array.from(els.scenePicker.querySelectorAll(".scene-card"));
      for (const card of cards) card.classList.toggle("is-active", card.dataset.scene === scene.id);
    }

    const renderCandidates = renderCandidatesForScene(scene);
    state.renderSrc = { candidates: renderCandidates, idx: 0 };
    const renderSrc = renderCandidates[0] || sceneUrl(scene, scene.videos.render);
    const inputSrc = sceneUrl(scene, scene.videos.input);
    const depthSrc = sceneUrl(scene, scene.videos.depth);

    els.videoRender.src = renderSrc;
    els.videoRender.poster = urlFromPage(scene.teaser || "./static/images/teaser-user.png");
    els.videoInput.src = inputSrc;
    els.videoDepth.src = depthSrc;
    videos.forEach((v) => v.load());

    const pc = scene.pointcloud;
    els.frameSlider.min = String(pc.frameStart);
    els.frameSlider.max = String(pc.frameEnd);
    els.frameSlider.value = String(pc.frameStart);

    const hasGlobal = hasGlobalPointCloud(scene);
    const globalSeg = els.segButtons.find((b) => b.dataset.view === "viewer");
    if (globalSeg) {
      globalSeg.disabled = !hasGlobal;
      globalSeg.classList.toggle("is-disabled", !hasGlobal);
      globalSeg.title = hasGlobal ? "" : "No global point cloud for this sequence";
    }

    updateFrameUI();

    if (isFrameViewerOpen()) {
      await loadCurrentFrameInFrameViewer();
    }

    if (state.view === "viewer") {
      if (hasGlobal) await loadGlobalPointCloud();
      else await showRender();
    } else {
      await showRender();
    }
  };

  const populateScenePicker = (scenes) => {
    if (!els.scenePicker) return;
    els.scenePicker.innerHTML = "";

    for (const s of scenes) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scene-card";
      btn.dataset.scene = s.id;
      btn.setAttribute("role", "listitem");
      btn.setAttribute("aria-label", `Select sequence ${s.name || s.id}`);

      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = `${s.name || s.id} preview`;
      img.src = urlFromPage(s.thumb || s.teaser || "./static/images/teaser-user.png");
      btn.appendChild(img);

      els.scenePicker.appendChild(btn);
    }
  };

  const loadManifest = async () => {
    try {
      const manifestUrl = urlFromPage("./example/manifest.json");
      const res = await fetch(manifestUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json?.scenes?.length) throw new Error("Invalid manifest");
      state.manifest = json;
      return json;
    } catch {
      state.manifest = defaultManifest;
      return defaultManifest;
    }
  };

  // Events
  els.togglePlay?.addEventListener("click", async () => {
    if (state.view !== "render") {
      await showRender();
      return;
    }
    if (anyPaused()) await playAll();
    else pauseAll();
  });

  els.pointSize?.addEventListener("input", async () => {
    const size = Number(els.pointSize.value);
    state.globalViewer?.setPointSize(size);
  });

  els.framePointSize?.addEventListener("input", async () => {
    const size = Number(els.framePointSize.value);
    state.frameViewer?.setPointSize(size);
  });

  els.resetView?.addEventListener("click", () => {
    if (state.view === "viewer") state.globalViewer?.resetView();
    else if (isFrameViewerOpen()) state.frameViewer?.resetView();
  });

  for (const btn of els.segButtons) {
    btn.addEventListener("click", async () => {
      const view = btn.dataset.view;
      if (view === "viewer") {
        await loadGlobalPointCloud();
      } else {
        await showRender();
      }
    });
  }

  els.scenePicker?.addEventListener("click", async (e) => {
    const target = e.target?.closest?.(".scene-card");
    const nextId = target?.dataset?.scene;
    if (!nextId) return;
    const next = state.manifest.scenes.find((s) => s.id === nextId);
    if (next) await setScene(next);
  });

  els.frameSlider.addEventListener("input", () => {
    updateFrameUI();
    if (!isFrameViewerOpen()) return;
    if (state.frameLoadTimer) window.clearTimeout(state.frameLoadTimer);
    state.frameLoadTimer = window.setTimeout(() => void loadCurrentFrameInFrameViewer(), 180);
  });

  els.openFrame3d?.addEventListener("click", async () => {
    await setFrameViewerOpen(!isFrameViewerOpen());
  });

  // Init
  (async () => {
    const manifest = await loadManifest();
    populateScenePicker(manifest.scenes);
    await setScene(manifest.scenes[0]);
    updatePlayButton();
  })();

  els.videoRender.addEventListener("error", async () => {
    const { candidates, idx } = state.renderSrc || {};
    if (!candidates?.length) return;
    const nextIdx = Number(idx) + 1;
    if (nextIdx >= candidates.length) return;
    state.renderSrc.idx = nextIdx;
    els.videoRender.src = candidates[nextIdx];
    els.videoRender.load();
    if (state.view === "render") await playAll();
  });
})();
