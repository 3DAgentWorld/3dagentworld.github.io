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
const galleryVideos = [inputVideo, renderVideo, minimapVideo, depthVideo].filter(Boolean);
let replayTimer = null;

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

function resetVideo(video) {
  if (!video) return;
  if (!video.getAttribute("src")) return;
  video.loop = false;
  const seekToStart = () => {
    try {
      video.currentTime = 0;
    } catch {
      // Some browsers only allow seeking after metadata is available.
    }
  };
  if (video.readyState > 0) {
    seekToStart();
  } else {
    video.addEventListener("loadedmetadata", seekToStart, { once: true });
  }
}

function playSyncedVideos() {
  window.clearTimeout(replayTimer);
  galleryVideos.forEach((video) => {
    resetVideo(video);
    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => {});
  });
}

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
});

playSyncedVideos();

const comparisonButtons = document.querySelectorAll(".comparison-scene");
const compareDrift = document.querySelector("#compare-drift");
const compareLocal = document.querySelector("#compare-local");
const compareOurs = document.querySelector("#compare-ours");

function activateComparisonScene(button) {
  comparisonButtons.forEach((item) => item.classList.toggle("active", item === button));
  if (compareDrift && button.dataset.driftGlb) compareDrift.dataset.src = button.dataset.driftGlb;
  if (compareLocal && button.dataset.localGlb) compareLocal.dataset.src = button.dataset.localGlb;
  if (compareOurs && button.dataset.oursGlb) compareOurs.dataset.src = button.dataset.oursGlb;
}

comparisonButtons.forEach((button) => {
  button.addEventListener("click", () => activateComparisonScene(button));
});

const activeComparison = Array.from(comparisonButtons).find((button) => button.classList.contains("active"));
if (activeComparison) activateComparisonScene(activeComparison);

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
scheduleComparisonRotate();

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
