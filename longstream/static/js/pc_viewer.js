let cachedModulesPromise;

async function loadThreeModules() {
  if (cachedModulesPromise) return cachedModulesPromise;

  cachedModulesPromise = Promise.all([
    import("https://unpkg.com/three@0.160.0/build/three.module.js"),
    import("https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"),
    import("https://unpkg.com/three@0.160.0/examples/jsm/loaders/PLYLoader.js"),
  ]).then(([threeModule, controlsModule, loaderModule]) => ({
    THREE: threeModule,
    OrbitControls: controlsModule.OrbitControls,
    PLYLoader: loaderModule.PLYLoader,
  }));

  return cachedModulesPromise;
}

export class PointCloudViewer {
  constructor({ mountEl, statusEl, flipY = true }) {
    this.mountEl = mountEl;
    this.statusEl = statusEl;
    this._flipY = Boolean(flipY);

    this._ready = false;
    this._disposed = false;
    this._raf = 0;

    this._THREE = null;
    this._OrbitControls = null;
    this._PLYLoader = null;

    this._scene = null;
    this._camera = null;
    this._renderer = null;
    this._controls = null;
    this._points = null;

    this._home = null;
    this._pointSize = 2.5;
    this._resizeObserver = null;
  }

  setFlipY(flipY) {
    this._flipY = Boolean(flipY);
    if (this._points) this._applyOrientation();
  }

  async init() {
    if (this._ready) return;
    const { THREE, OrbitControls, PLYLoader } = await loadThreeModules();
    this._THREE = THREE;
    this._OrbitControls = OrbitControls;
    this._PLYLoader = PLYLoader;

    const scene = new THREE.Scene();
    this._scene = scene;

    const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 1e6);
    camera.position.set(0, 0, 4);
    this._camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    this._renderer = renderer;

    this.mountEl.innerHTML = "";
    this.mountEl.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.75;
    this._controls = controls;

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.mountEl);
    this._resize();

    const animate = () => {
      if (this._disposed) return;
      this._raf = window.requestAnimationFrame(animate);
      this._controls.update();
      this._renderer.render(this._scene, this._camera);
    };
    animate();

    this._ready = true;
  }

  setPointSize(size) {
    const s = Number(size);
    if (!Number.isFinite(s)) return;
    this._pointSize = s;
    if (this._points?.material) {
      this._points.material.size = s;
      this._points.material.needsUpdate = true;
    }
  }

  resetView() {
    if (!this._home || !this._camera || !this._controls) return;
    this._camera.position.copy(this._home.cameraPos);
    this._controls.target.copy(this._home.target);
    this._controls.update();
  }

  async loadPly(url, { flipY } = {}) {
    if (typeof flipY !== "undefined") this._flipY = Boolean(flipY);
    await this.init();

    const THREE = this._THREE;
    const loader = new this._PLYLoader();

    this._setStatus("Loading point cloud…");

    const geometry = await new Promise((resolve, reject) => {
      loader.load(
        url,
        (g) => resolve(g),
        undefined,
        (err) => reject(err || new Error("Failed to load PLY")),
      );
    });

    geometry.computeBoundingBox();

    const hasColor = Boolean(geometry.attributes?.color);
    const material = new THREE.PointsMaterial({
      size: this._pointSize,
      sizeAttenuation: true,
      vertexColors: hasColor,
      color: hasColor ? 0xffffff : 0x2a74ff,
      transparent: true,
      opacity: 0.95,
    });

    if (this._points) {
      this._scene.remove(this._points);
      this._disposePoints();
    }

    geometry.center();
    const points = new THREE.Points(geometry, material);
    this._points = points;
    this._applyOrientation();
    this._scene.add(points);

    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    const radius = Math.max(0.05, size.length() * 0.5);

    const cameraDistance = radius * 2.2;
    this._camera.position.set(cameraDistance, cameraDistance * 0.35, cameraDistance);
    this._controls.target.set(0, 0, 0);
    this._controls.update();

    this._home = {
      cameraPos: this._camera.position.clone(),
      target: this._controls.target.clone(),
    };

    const pointCount = geometry.attributes?.position?.count ?? 0;
    this._setStatus(`${pointCount.toLocaleString()} points`);
    return pointCount;
  }

  dispose() {
    this._disposed = true;
    if (this._raf) window.cancelAnimationFrame(this._raf);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._disposePoints();
    if (this._renderer) this._renderer.dispose();
  }

  _disposePoints() {
    if (!this._points) return;
    const p = this._points;
    this._points = null;
    p.geometry?.dispose?.();
    p.material?.dispose?.();
  }

  _applyOrientation() {
    if (!this._points) return;
    this._points.scale.set(1, this._flipY ? -1 : 1, 1);
  }

  _resize() {
    if (!this._renderer || !this._camera) return;
    const rect = this.mountEl.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    this._renderer.setSize(w, h, false);
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
  }

  _setStatus(text) {
    if (!this.statusEl) return;
    this.statusEl.textContent = text;
  }
}
