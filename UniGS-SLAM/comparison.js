/* Dense comparison matrix: columns are methods versus ours; rows are scenes. */
(() => {
  const all = window.UNIGS_COMPARISONS;
  if (!all) return;
  document.querySelectorAll('[data-comparison]').forEach(root => {
    const data = all[root.dataset.comparison];
    if (!data?.scenes?.length) return;
    const methods = data.methods.filter(m => m.id !== 'ours');
    root.classList.add('comparison-matrix');
    root.innerHTML = `
      <div class="matrix-toolbar">
        <span class="matrix-view-label">Full-view comparisons</span>
        <button type="button" class="matrix-reset">Reset sliders</button>
      </div>
      <div class="matrix-scroll" tabindex="0" role="region" aria-label="Scene comparison matrix; scroll horizontally on small screens">
        <div class="matrix-table" role="table" aria-label="Methods compared with UniGS-SLAM"></div>
      </div>
      <p class="matrix-note">Drag each divider to compare. Native viewpoints are preserved.</p>`;
    const table = root.querySelector('.matrix-table');
    table.style.setProperty('--methods', methods.length);
    const header = document.createElement('div'); header.className = 'matrix-header'; header.setAttribute('role', 'row');
    const corner = document.createElement('div'); corner.className = 'matrix-corner'; corner.setAttribute('role', 'columnheader'); corner.textContent = 'Scene'; header.append(corner);
    methods.forEach(method => {
      const heading = document.createElement('div'); heading.className = 'matrix-method'; heading.setAttribute('role', 'columnheader');
      const name = document.createElement('strong'); name.textContent = method.label;
      const vs = document.createElement('span'); vs.textContent = 'vs UniGS-SLAM'; heading.append(name, vs); header.append(heading);
    });
    table.append(header);
    const cells = [];
    data.scenes.forEach(scene => {
      const row = document.createElement('div'); row.className = 'matrix-row'; row.setAttribute('role', 'row'); row.dataset.scene = scene.id;
      const meta = document.createElement('div'); meta.className = 'matrix-scene'; meta.setAttribute('role', 'rowheader');
      const dataset = document.createElement('span'); dataset.className = 'scene-dataset'; dataset.textContent = scene.dataset;
      const title = document.createElement('strong'); title.textContent = scene.label.replace(' · frame ', '\nFrame ');
      meta.append(dataset, title);
      row.append(meta);
      methods.forEach(method => {
        const cell = document.createElement('div'); cell.className = 'matrix-cell'; cell.setAttribute('role', 'cell'); cell.dataset.method = method.id;
        cell.innerHTML = `
          <div class="matrix-stage" style="--split:50%">
            <div class="matrix-layer matrix-ours"><img decoding="async" loading="lazy" draggable="false" alt=""><span class="matrix-image-label">UniGS-SLAM</span></div>
            <div class="matrix-layer matrix-baseline"><img decoding="async" loading="lazy" draggable="false" alt=""></div>
            <div class="matrix-handle" aria-hidden="true"><span>↔</span></div>
          </div>
          <input class="matrix-slider" type="range" min="0" max="100" step="1" value="50">`;
        const slider = cell.querySelector('input');
        slider.setAttribute('aria-label', `${scene.dataset} ${scene.label}: ${method.label} versus UniGS-SLAM`);
        const state = {scene, method, cell, slider};
        cells.push(state);
        const split = value => {
          const n = Math.max(0, Math.min(100, Math.round(Number(value))));
          slider.value = n;
          cell.querySelector('.matrix-stage').style.setProperty('--split', n + '%');
          slider.setAttribute('aria-valuetext', `${n}% ${method.label}, ${100 - n}% UniGS-SLAM`);
        };
        state.setSplit = split;
        slider.addEventListener('input', () => split(slider.value));
        const handle = cell.querySelector('.matrix-handle');
        const drag = event => {
          const rect = cell.querySelector('.matrix-stage').getBoundingClientRect();
          split((event.clientX - rect.left) / rect.width * 100);
        };
        handle.addEventListener('pointerdown', event => { event.preventDefault(); handle.setPointerCapture(event.pointerId); drag(event); });
        handle.addEventListener('pointermove', event => { if (handle.hasPointerCapture(event.pointerId)) drag(event); });
        handle.addEventListener('pointerup', event => { if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId); });
        split(50); row.append(cell);
      });
      table.append(row);
    });
    function update(state) {
      const {scene, method, cell} = state;
      const images = scene.images;
      const ours = cell.querySelector('.matrix-ours img');
      const baseline = cell.querySelector('.matrix-baseline img');
      ours.src = images.ours; baseline.src = images[method.id];
      ours.alt = `UniGS-SLAM · ${scene.dataset} · ${scene.label}`;
      baseline.alt = `${method.label} · ${scene.dataset} · ${scene.label}`;
      cell.querySelector('.matrix-stage').style.setProperty('--aspect', scene.aspect);
    }
    root.querySelector('.matrix-reset').addEventListener('click', () => cells.forEach(s => s.setSplit(50)));
    cells.forEach(update);
    root.hidden = false;
    const paper = root.parentElement.querySelector('.paper-figures');
    if (paper) paper.open = false;
  });
})();
