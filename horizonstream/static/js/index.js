const copyButton = document.querySelector("#copy-bibtex");
const bibtexCode = document.querySelector("#bibtex-code");

if (copyButton && bibtexCode) {
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(bibtexCode.textContent.trim());
      copyButton.textContent = "Copied";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1400);
    } catch {
      copyButton.textContent = "Select text";
    }
  });
}

const sceneButtons = document.querySelectorAll(".scene-button");
const inputVideo = document.querySelector("#gallery-input");
const renderVideo = document.querySelector("#gallery-render");
const minimapVideo = document.querySelector("#gallery-minimap");
const depthVideo = document.querySelector("#gallery-depth");
const galleryLoading = document.querySelector("#gallery-loading");
const galleryVideos = [inputVideo, renderVideo, minimapVideo, depthVideo].filter(Boolean);
let replayTimer = null;
let galleryReady = false;
let syncPaused = false; // true when at least one video is buffering

document.querySelectorAll('.pill[aria-disabled="true"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

function updateVideo(video, src, poster) {
  if (!video) return;
  const panel = video.closest(".instrument-tile, .media-panel, .render-main");
  if (!src) {
    if (panel) panel.hidden = true;
    video.removeAttribute("src");
    video.load();
    return;
  }
  if (panel) panel.hidden = false;
  video.loop = false;
  const nextSrc = new URL(src, window.location.href).href;
  if (video.currentSrc !== nextSrc && video.getAttribute("src") !== src) {
    video.setAttribute("src", src);
    if (poster) video.setAttribute("poster", poster);
    video.load();
  } else if (poster) {
    video.setAttribute("poster", poster);
  }
}

function showLoading() {
  if (galleryLoading) galleryLoading.classList.remove("hidden");
}

function hideLoading() {
  if (galleryLoading) galleryLoading.classList.add("hidden");
}

function activeVideos() {
  return galleryVideos.filter(
    (v) => v.getAttribute("src") && !v.closest("[hidden]")
  );
}

/* ── Synchronized playback: play together, pause together on buffer ── */

function onVideoWaiting() {
  // A video is buffering — pause all others so they stay in sync
  if (syncPaused) return;
  syncPaused = true;
  showLoading();
  const videos = activeVideos();
  videos.forEach((v) => {
    if (!v.paused && !v.ended) v.pause();
  });
}

function onVideoCanResume() {
  // A video finished buffering — check if ALL are ready, then resume together
  if (!syncPaused) return;
  const videos = activeVideos();
  const allReady = videos.every((v) => v.readyState >= 3 || v.ended);
  if (!allReady) return;

  syncPaused = false;
  hideLoading();

  // Sync currentTime to the minimum to avoid drift
  const times = videos.filter((v) => !v.ended).map((v) => v.currentTime);
  if (times.length > 0) {
    const minTime = Math.min(...times);
    videos.forEach((v) => {
      if (!v.ended && Math.abs(v.currentTime - minTime) > 0.1) {
        try { v.currentTime = minTime; } catch {}
      }
    });
  }

  videos.forEach((v) => {
    if (!v.ended) {
      const p = v.play();
      if (p) p.catch(() => {});
    }
  });
}

function playSyncedVideos() {
  window.clearTimeout(replayTimer);
  syncPaused = false;
  const videos = activeVideos();
  if (videos.length === 0) return;

  showLoading();
  videos.forEach((v) => v.pause());

  // Wait for at least one video to be playable, then start all immediately.
  // If some aren't ready yet, the waiting/canplay sync handlers will manage pausing.
  const ready = videos.map(
    (v) =>
      new Promise((resolve) => {
        if (v.readyState >= 3) {
          resolve();
        } else {
          v.addEventListener("canplay", resolve, { once: true });
        }
      })
  );

  // Start as soon as ANY video is ready (Promise.any), but ideally all
  // Use a race: either all ready, or timeout after 500ms and start what we can
  const allReady = Promise.all(ready);
  const timeout = new Promise((resolve) => setTimeout(resolve, 500));

  Promise.race([allReady, timeout]).then(() => {
    videos.forEach((v) => {
      try { v.currentTime = 0; } catch {}
    });
    hideLoading();
    videos.forEach((v) => {
      const p = v.play();
      if (p) p.catch(() => {});
    });

    if (!galleryReady) {
      galleryReady = true;
      preloadNextScene();
      loadInitialComparison();
    }
  });
}

/* ── Preloading: fetch next scene videos into browser cache ── */

let preloadedSceneIndex = -1;

function preloadNextScene() {
  const activeIndex = Array.from(sceneButtons).findIndex((b) => b.classList.contains("active"));
  const nextIndex = (activeIndex + 1) % sceneButtons.length;
  if (nextIndex === preloadedSceneIndex) return;
  preloadedSceneIndex = nextIndex;

  const button = sceneButtons[nextIndex];
  const srcs = [button.dataset.input, button.dataset.render, button.dataset.minimap, button.dataset.depth].filter(Boolean);

  // Use fetch to pull videos into browser cache with low priority
  srcs.forEach((src) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = src;
    document.head.appendChild(link);
  });
}

function preloadAllScenes() {
  // Prefetch all remaining scenes after the gallery has been playing
  sceneButtons.forEach((button, i) => {
    if (i === preloadedSceneIndex) return;
    const srcs = [button.dataset.input, button.dataset.render, button.dataset.minimap, button.dataset.depth].filter(Boolean);
    srcs.forEach((src) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = src;
      document.head.appendChild(link);
    });
  });
}

/* ── Replay / auto-advance ── */

function videoHasFinished(video) {
  if (!video) return true;
  if (!video.getAttribute("src") || video.closest("[hidden]")) return true;
  if (video.ended) return true;
  if (Number.isFinite(video.duration) && video.duration > 0) {
    return video.currentTime >= video.duration - 0.08;
  }
  return false;
}

function replayWhenAllFinished() {
  if (galleryVideos.every(videoHasFinished)) {
    // Preload next scene right when current finishes
    preloadNextScene();
    replayTimer = window.setTimeout(activateNextSceneOrReplay, 360);
  }
}

function activateNextSceneOrReplay() {
  if (sceneButtons.length <= 1) {
    playSyncedVideos();
    return;
  }
  const activeIndex = Array.from(sceneButtons).findIndex((button) => button.classList.contains("active"));
  const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % sceneButtons.length : 0;
  activateScene(sceneButtons[nextIndex]);
}

function activateScene(button) {
  sceneButtons.forEach((item) => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
  });

  showLoading();
  updateVideo(inputVideo, button.dataset.input, button.dataset.inputPoster);
  updateVideo(renderVideo, button.dataset.render, button.dataset.renderPoster);
  updateVideo(minimapVideo, button.dataset.minimap, button.dataset.minimapPoster);
  updateVideo(depthVideo, button.dataset.depth, button.dataset.depthPoster);
  playSyncedVideos();
}

sceneButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateScene(button);
  });
});

galleryVideos.forEach((video) => {
  video.loop = false;
  video.addEventListener("ended", replayWhenAllFinished);
  // Sync handlers: pause all when one buffers, resume when all ready
  video.addEventListener("waiting", onVideoWaiting);
  video.addEventListener("canplay", onVideoCanResume);
  video.addEventListener("canplaythrough", onVideoCanResume);
});

// Load first scene immediately
const firstActive = document.querySelector(".scene-button.active");
if (firstActive) activateScene(firstActive);

// After 3s, start prefetching all other scenes
setTimeout(preloadAllScenes, 3000);

/* ── Comparison section (GLBs deferred until gallery ready) ── */

const comparisonButtons = document.querySelectorAll(".comparison-scene");
const compareDrift = document.querySelector("#compare-drift");
const compareLocal = document.querySelector("#compare-local");
const compareOurs = document.querySelector("#compare-ours");
const poseDrift = document.querySelector("#pose-drift");
const poseLocal = document.querySelector("#pose-local");
const poseOurs = document.querySelector("#pose-ours");

function activateComparisonScene(button) {
  comparisonButtons.forEach((item) => item.classList.toggle("active", item === button));
  if (compareDrift && button.dataset.driftGlb) compareDrift.dataset.src = button.dataset.driftGlb;
  if (compareLocal && button.dataset.localGlb) compareLocal.dataset.src = button.dataset.localGlb;
  if (compareOurs && button.dataset.oursGlb) compareOurs.dataset.src = button.dataset.oursGlb;
  if (poseDrift && button.dataset.driftPose) poseDrift.src = button.dataset.driftPose;
  if (poseLocal && button.dataset.localPose) poseLocal.src = button.dataset.localPose;
  if (poseOurs && button.dataset.oursPose) poseOurs.src = button.dataset.oursPose;
}

comparisonButtons.forEach((button) => {
  button.addEventListener("click", () => activateComparisonScene(button));
});

document.querySelectorAll("[data-video-compare]").forEach((compare) => {
  const windowEl = compare.querySelector(".video-compare-window");
  const videos = Array.from(compare.querySelectorAll("video"));
  const leadVideo = videos[0];
  let syncing = false;

  function setSplit(value) {
    const split = Math.max(5, Math.min(95, value));
    compare.style.setProperty("--split", `${split}%`);
    if (windowEl) windowEl.setAttribute("aria-valuenow", String(Math.round(split)));
  }

  function updateSplitFromPointer(event) {
    if (!windowEl) return;
    const rect = windowEl.getBoundingClientRect();
    setSplit(((event.clientX - rect.left) / rect.width) * 100);
  }

  function syncVideos() {
    if (!leadVideo || syncing) return;
    syncing = true;
    videos.slice(1).forEach((video) => {
      if (Math.abs(video.currentTime - leadVideo.currentTime) > 0.08) {
        try { video.currentTime = leadVideo.currentTime; } catch {}
      }
      if (leadVideo.paused && !video.paused) {
        video.pause();
      } else if (!leadVideo.paused && video.paused) {
        const play = video.play();
        if (play) play.catch(() => {});
      }
    });
    syncing = false;
  }

  videos.forEach((video) => {
    video.muted = true;
    video.loop = true;
    video.addEventListener("play", syncVideos);
    video.addEventListener("seeked", syncVideos);
    video.addEventListener("canplay", syncVideos);
  });

  if (leadVideo) {
    window.setInterval(syncVideos, 500);
  }

  if (windowEl) {
    windowEl.addEventListener("pointerdown", (event) => {
      windowEl.setPointerCapture(event.pointerId);
      updateSplitFromPointer(event);
    });
    windowEl.addEventListener("pointermove", (event) => {
      if (windowEl.hasPointerCapture(event.pointerId)) updateSplitFromPointer(event);
    });
    windowEl.addEventListener("keydown", (event) => {
      const current = parseFloat(compare.style.getPropertyValue("--split")) || 50;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSplit(current - 4);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSplit(current + 4);
      } else if (event.key === "Home") {
        event.preventDefault();
        setSplit(5);
      } else if (event.key === "End") {
        event.preventDefault();
        setSplit(95);
      }
    });
  }
});

function loadInitialComparison() {
  const active = Array.from(comparisonButtons).find((b) => b.classList.contains("active"));
  if (active) activateComparisonScene(active);
  scheduleComparisonRotate();
}

let comparisonRotateTimer = null;
function scheduleComparisonRotate() {
  window.clearTimeout(comparisonRotateTimer);
  if (comparisonButtons.length <= 1) return;
  comparisonRotateTimer = window.setTimeout(() => {
    const activeIndex = Array.from(comparisonButtons).findIndex((button) => button.classList.contains("active"));
    const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % comparisonButtons.length : 0;
    activateComparisonScene(comparisonButtons[nextIndex]);
    scheduleComparisonRotate();
  }, 9000);
}

const canvas = document.querySelector("#field-canvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && !reducedMotion) {
  const ctx = canvas.getContext("2d");
  const colors = ["#28d7cb", "#3d61ff", "#23a36f", "#ff5f57", "#e6a33a"];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let traces = [];

  function buildTraces() {
    traces = Array.from({ length: 24 }, (_, index) => {
      const startX = -120 - Math.random() * width * 0.3;
      const startY = Math.random() * height * 0.96;
      const drift = 0.12 + Math.random() * 0.34;
      const wave = 34 + Math.random() * 118;
      const points = Array.from({ length: 18 }, (_, pointIndex) => {
        const t = pointIndex / 17;
        return {
          x: startX + t * (width + 260) + Math.sin(t * 5 + index) * 24,
          y: startY + Math.sin(t * 7 + index * 0.8) * wave + t * height * (drift - 0.24),
        };
      });
      return {
        points,
        color: colors[index % colors.length],
        speed: 0.18 + Math.random() * 0.44,
        offset: Math.random() * 1000,
      };
    });
  }

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTraces();
  }

  function drawTrace(trace, now) {
    const shift = ((now * trace.speed + trace.offset) % 260) - 130;
    ctx.beginPath();
    trace.points.forEach((point, index) => {
      const x = point.x + shift;
      const y = point.y;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        const previous = trace.points[index - 1];
        const cx = (previous.x + x) / 2;
        ctx.quadraticCurveTo(previous.x + shift, previous.y, cx, y);
      }
    });
    ctx.strokeStyle = trace.color;
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const head = trace.points[Math.floor((now * trace.speed * 0.02 + trace.offset) % trace.points.length)];
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = trace.color;
    ctx.fillRect(head.x + shift - 2, head.y - 2, 4, 4);
  }

  function draw(now = 0) {
    ctx.clearRect(0, 0, width, height);
    traces.forEach((trace) => drawTrace(trace, now * 0.001));
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  resizeCanvas();
  requestAnimationFrame(draw);
}
