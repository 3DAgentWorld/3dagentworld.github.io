function parseGlb(bytes) {
  const view = new DataView(bytes);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("Invalid GLB");

  let offset = 12;
  let json = null;
  let bin = null;
  while (offset < bytes.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    offset += 8;
    const chunk = bytes.slice(offset, offset + length);
    offset += length;
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(chunk));
    if (type === 0x004e4942) bin = chunk;
  }
  if (!json || !bin) throw new Error("Missing GLB chunks");
  return { json, bin };
}

const componentInfo = {
  5121: { array: Uint8Array, size: 1 },
  5123: { array: Uint16Array, size: 2 },
  5125: { array: Uint32Array, size: 4 },
  5126: { array: Float32Array, size: 4 },
};

const typeSize = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const MAX_POINTS = 250000;

function readAccessor(gltf, bin, index) {
  const accessor = gltf.accessors[index];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const component = componentInfo[accessor.componentType];
  const itemSize = typeSize[accessor.type];
  const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const count = accessor.count * itemSize;
  const stride = bufferView.byteStride;

  if (!stride || stride === component.size * itemSize) {
    return { data: new component.array(bin, byteOffset, count), accessor };
  }

  const source = new DataView(bin, byteOffset, stride * accessor.count);
  const out = new component.array(count);
  for (let i = 0; i < accessor.count; i += 1) {
    for (let j = 0; j < itemSize; j += 1) {
      const o = i * stride + j * component.size;
      const target = i * itemSize + j;
      if (accessor.componentType === 5126) out[target] = source.getFloat32(o, true);
      if (accessor.componentType === 5121) out[target] = source.getUint8(o);
      if (accessor.componentType === 5123) out[target] = source.getUint16(o, true);
      if (accessor.componentType === 5125) out[target] = source.getUint32(o, true);
    }
  }
  return { data: out, accessor };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compile(gl, gl.VERTEX_SHADER, `
    attribute vec3 a_position;
    attribute vec3 a_color;
    uniform mat4 u_matrix;
    uniform float u_pointSize;
    varying vec3 v_color;
    void main() {
      vec3 pos = vec3(a_position.x, -a_position.y, a_position.z);
      gl_Position = u_matrix * vec4(pos, 1.0);
      gl_PointSize = u_pointSize;
      v_color = a_color;
    }
  `);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 v_color;
    void main() {
      gl_FragColor = vec4(v_color, 1.0);
    }
  `);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
  }
  return program;
}

function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

function viewMatrix(yaw, pitch, distance, center) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return new Float32Array([
    cy, sp * sy, -cp * sy, 0,
    0, cp, sp, 0,
    sy, -sp * cy, cp * cy, 0,
    -center[0] * cy - center[2] * sy,
    -center[0] * sp * sy - center[1] * cp + center[2] * sp * cy,
    center[0] * cp * sy - center[1] * sp - center[2] * cp * cy - distance,
    1,
  ]);
}

function setupPointCloudViewer(container) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
  if (!gl) return;

  container.appendChild(canvas);
  const program = createProgram(gl);
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const colorLocation = gl.getAttribLocation(program, "a_color");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");
  const pointSizeLocation = gl.getUniformLocation(program, "u_pointSize");

  let drawables = [];
  let bounds = { min: [-1, -1, -1], max: [1, 1, 1], center: [0, 0, 0], radius: 1 };
  let yaw = -0.62;
  let pitch = 0.62;
  let distance = 4;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let activeLoadId = 0;

  function setStatus(text) {
    container.dataset.status = text;
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function updateBounds(position) {
    for (let i = 0; i < position.length; i += 3) {
      bounds.min[0] = Math.min(bounds.min[0], position[i]);
      bounds.min[1] = Math.min(bounds.min[1], -position[i + 1]);
      bounds.min[2] = Math.min(bounds.min[2], position[i + 2]);
      bounds.max[0] = Math.max(bounds.max[0], position[i]);
      bounds.max[1] = Math.max(bounds.max[1], -position[i + 1]);
      bounds.max[2] = Math.max(bounds.max[2], position[i + 2]);
    }
  }

  function makeBuffer(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  }

  async function load(src) {
    if (!src) return;
    const loadId = activeLoadId + 1;
    activeLoadId = loadId;
    container.dataset.loading = "true";
    setStatus("Loading");
    drawables = [];
    bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity], center: [0, 0, 0], radius: 1 };
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { json, bin } = parseGlb(await response.arrayBuffer());
      if (loadId !== activeLoadId) return;

      json.meshes.forEach((mesh) => {
        mesh.primitives.forEach((primitive) => {
          const position = readAccessor(json, bin, primitive.attributes.POSITION).data;
          const colorAccessor = primitive.attributes.COLOR_0;
          const colorResult = colorAccessor !== undefined ? readAccessor(json, bin, colorAccessor) : null;
          const rawColor = colorResult?.data || null;
          const colorScale = colorResult?.accessor?.componentType === 5121 ? 255 : 1;
          const sourceCount = position.length / 3;
          const stride = primitive.mode === 0 ? Math.max(1, Math.ceil(sourceCount / MAX_POINTS)) : 1;
          const targetCount = Math.ceil(sourceCount / stride);
          const positions = new Float32Array(targetCount * 3);
          const colors = new Float32Array(targetCount * 3);

          // Get material color for lines without per-vertex color
          let matColor = [0.12, 0.42, 1.0];
          if (!rawColor && primitive.material !== undefined && json.materials) {
            const mat = json.materials[primitive.material];
            const bc = mat?.pbrMetallicRoughness?.baseColorFactor;
            if (bc) matColor = [bc[0], bc[1], bc[2]];
          }

          for (let source = 0, target = 0; source < sourceCount; source += stride, target += 1) {
            positions[target * 3] = position[source * 3];
            positions[target * 3 + 1] = position[source * 3 + 1];
            positions[target * 3 + 2] = position[source * 3 + 2];
            colors[target * 3] = rawColor ? rawColor[source * 3] / colorScale : matColor[0];
            colors[target * 3 + 1] = rawColor ? rawColor[source * 3 + 1] / colorScale : matColor[1];
            colors[target * 3 + 2] = rawColor ? rawColor[source * 3 + 2] / colorScale : matColor[2];
          }
          updateBounds(positions);
          const mode = primitive.mode === 0 ? gl.POINTS : primitive.mode === 3 ? gl.LINE_STRIP : gl.LINES;
          drawables.push({
            mode,
            count: positions.length / 3,
            position: makeBuffer(positions),
            color: makeBuffer(colors),
          });
        });
      });

      bounds.center = [
        (bounds.min[0] + bounds.max[0]) / 2,
        (bounds.min[1] + bounds.max[1]) / 2,
        (bounds.min[2] + bounds.max[2]) / 2,
      ];
      bounds.radius = Math.max(bounds.max[0] - bounds.min[0], bounds.max[1] - bounds.min[1], bounds.max[2] - bounds.min[2], 1);
      distance = bounds.radius * 1.25;
      container.dataset.loading = "false";
      const pointCount = drawables.reduce((sum, item) => sum + item.count, 0);
      setStatus(`${Math.round(pointCount / 1000)}k pts`);
    } catch (error) {
      container.dataset.loading = "error";
      container.dataset.error = error.message;
      setStatus(error.message);
    }
  }

  function draw(now = 0) {
    resize();
    gl.clearColor(0.98, 0.99, 1.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(program);

    if (!dragging) yaw += 0.00012 * (now ? 16 : 0);
    const projection = perspective(Math.PI / 4, canvas.width / canvas.height, Math.max(bounds.radius / 10000, 0.01), bounds.radius * 100);
    const matrix = multiply(projection, viewMatrix(yaw, pitch, distance, bounds.center));
    gl.uniformMatrix4fv(matrixLocation, false, matrix);
    gl.uniform1f(pointSizeLocation, Math.max(2.2, Math.min(5.0, canvas.width / 360)));

    drawables.forEach((item) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, item.position);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, item.color);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(item.mode, 0, item.count);
    });
    requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    yaw += (event.clientX - lastX) * 0.006;
    pitch = Math.max(-1.2, Math.min(1.2, pitch + (event.clientY - lastY) * 0.004));
    lastX = event.clientX;
    lastY = event.clientY;
  });
  canvas.addEventListener("pointerup", () => {
    dragging = false;
  });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomSpeed = 0.003;
    distance = Math.max(bounds.radius * 0.05, Math.min(bounds.radius * 10, distance * (1 + event.deltaY * zoomSpeed)));
  }, { passive: false });

  const observer = new MutationObserver(() => load(container.dataset.src));
  observer.observe(container, { attributes: true, attributeFilter: ["data-src"] });
  if (container.dataset.src) load(container.dataset.src);
  requestAnimationFrame(draw);
}

document.querySelectorAll(".compare-cloud").forEach(setupPointCloudViewer);
