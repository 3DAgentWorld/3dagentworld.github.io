function setupPointCloudViewer(container) {
  const viewer = document.createElement("model-viewer");
  viewer.setAttribute("camera-controls", "");
  viewer.setAttribute("auto-rotate", "");
  viewer.setAttribute("auto-rotate-delay", "0");
  viewer.setAttribute("rotation-per-second", "12deg");
  viewer.setAttribute("interaction-prompt", "none");
  viewer.setAttribute("shadow-intensity", "0");
  viewer.setAttribute("environment-image", "neutral");
  viewer.setAttribute("camera-orbit", "45deg 65deg auto");
  viewer.setAttribute("min-camera-orbit", "auto auto auto");
  viewer.setAttribute("max-camera-orbit", "Infinity 160deg auto");
  viewer.style.width = "100%";
  viewer.style.height = "100%";
  viewer.style.minHeight = "320px";
  viewer.style.display = "block";
  viewer.style.background = "transparent";
  viewer.style.setProperty("--poster-color", "transparent");

  if (container.dataset.src) {
    viewer.setAttribute("src", container.dataset.src);
  }

  container.appendChild(viewer);

  viewer.addEventListener("load", () => {
    container.dataset.loading = "false";
    container.dataset.status = "loaded";
  });

  viewer.addEventListener("error", () => {
    container.dataset.loading = "error";
    container.dataset.status = "error";
  });

  const observer = new MutationObserver(() => {
    const src = container.dataset.src;
    if (src) {
      viewer.setAttribute("src", src);
      container.dataset.loading = "true";
      container.dataset.status = "Loading";
    }
  });
  observer.observe(container, { attributes: true, attributeFilter: ["data-src"] });
}

document.querySelectorAll(".compare-cloud[data-src]").forEach(setupPointCloudViewer);
