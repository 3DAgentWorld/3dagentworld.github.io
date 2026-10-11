(() => {
  const C = window.CAMERAVLM_CONTENT, P = window.PAPER;
  const RED = '#d8352a', INK = '#0e1013', SLATE = '#5d6470', GREY = '#aeb4bc';
  const FONT = 'Archivo, system-ui, sans-serif';
  const charts = {};
  const base = {
    animationDuration: 600, animationEasing: 'cubicOut',
    textStyle: { fontFamily: FONT, color: '#454a52' },
    tooltip: { confine: true, backgroundColor: '#fff', borderColor: '#e2e3e6', borderWidth: 1, textStyle: { color: INK, fontSize: 13, fontFamily: FONT }, extraCssText: 'border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.08)' },
    aria: { enabled: true }
  };
  const axis = { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 13, color: '#6a7079', fontFamily: FONT }, splitLine: { lineStyle: { color: '#eef0f2' } } };
  const $ = id => document.getElementById(id);

  function mount(id, option, rebuild) {
    const el = $(id);
    if (!el || !window.echarts) return;
    const c = echarts.init(el, null, { renderer: 'svg' });
    c.setOption({ ...base, ...(typeof option === 'function' ? option(el) : option) });
    charts[id] = c;
    new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      c.resize();
      if (rebuild) c.setOption({ ...base, ...option(el) }, { notMerge: true });
    }).observe(el);
  }
  function legend(id, items) {
    const el = $(id); if (!el) return;
    el.innerHTML = items.map(([n, col]) => `<span><i style="background:${col}"></i>${n}</span>`).join('');
  }

  // ---- Fig. 1(b): accuracy vs parameters, with the Pareto front of the baselines (as in the paper)
  const family = m => /CameraModel|ACaM|CamReasoner|ShotVL/.test(m) ? 2 : /Cambrian|CamDistill|CamInject|VLM-3R|Spatial/.test(m) ? 1 : 0;
  const CLOSED = { 'Gemini 3.5 Flash': 300, 'Claude Opus 4.8': 2700, 'GPT-6 Astra (high)': 6000 };  // estimated, not public
  let metric = 3;
  function scatter(el) {
    const W = el ? el.clientWidth : 800, H = el ? el.clientHeight : 430;
    const narrow = W < 440;
    const G = { left: 44, right: 16, top: 30, bottom: narrow ? 150 : 96 };
    const Y0 = 40, Y1 = 90;
    // data -> pixel, for placing the frontier labels in the empty lower-right area
    const px = b => G.left + Math.log10(b) / 4 * (W - G.left - G.right);
    const py = v => G.top + (Y1 - v) / (Y1 - Y0) * (H - G.top - G.bottom);
    const score = n => C.paperModels.find(m => m.model === n).scores[metric];

    const groups = [
      { name: 'General open-source', symbol: 'circle', color: GREY, data: [] },
      { name: 'Geometry-aware', symbol: 'rect', color: '#8b93a0', data: [] },
      { name: 'Camera-motion-specific', symbol: 'triangle', color: SLATE, data: [] }
    ];
    C.paperModels.filter(m => m.params && m.model !== 'CameraVLM').forEach(m => groups[family(m.model)].data.push({ name: m.model, value: [m.params, m.scores[metric]] }));
    const ours = C.paperModels.find(m => m.model === 'CameraVLM');
    const human = C.paperModels.find(m => m.model === 'Human');

    // Pareto front: every baseline that beats all smaller baselines
    const base = C.paperModels.filter(m => m.model !== 'CameraVLM' && m.model !== 'Human')
      .map(m => ({ name: m.model, b: m.params || CLOSED[m.model], v: m.scores[metric] })).filter(m => m.b)
      .sort((a, b) => a.b - b.b || b.v - a.v);
    const front = []; base.forEach(m => { if (!front.length || m.v > front[front.length - 1].v) front.push(m); });

    const series = [{ name: 'Baseline Pareto front', type: 'line', z: 1, silent: true, symbol: 'none', data: front.map(m => [m.b, m.v]),
      lineStyle: { color: '#3b4048', type: [6, 5], width: 1.6 }, itemStyle: { color: '#3b4048' }, tooltip: { show: false } }];
    series.push(...groups.map(g => ({ name: g.name, type: 'scatter', symbol: g.symbol, symbolSize: 11, itemStyle: { color: g.color }, emphasis: { scale: 1.6 }, data: g.data })));

    // closed-source models: name and score always on the chart
    const lab = (pos, color, size, weight) => ({ show: true, position: pos, distance: 8, color, fontSize: size, fontWeight: weight, fontFamily: FONT, lineHeight: size + 3 });
    const closed = [
      { name: 'Gemini 3.5 Flash', label: { ...lab('bottom', '#5d6470', narrow ? 11 : 12.5, 650), formatter: p => `Gemini 3.5 Flash\n${p.value[1].toFixed(2)}` } },
      { name: 'Claude Opus 4.8', label: { ...lab('bottom', '#5d6470', narrow ? 11 : 12.5, 650), formatter: p => `Claude Opus 4.8\n${p.value[1].toFixed(2)}` } },
      { name: 'GPT-6 Astra (high)', symbolSize: 15, itemStyle: { color: '#1f5fbf' }, label: { ...lab('left', '#1f5fbf', narrow ? 12 : 13.5, 750), formatter: p => `${narrow ? 'GPT-6' : 'GPT-6 Astra'} ${p.value[1].toFixed(2)}` } }
    ].map(d => ({ ...d, value: [CLOSED[d.name], score(d.name)], est: true }));
    series.push({ name: 'Closed-source (parameters estimated)', type: 'scatter', symbol: 'diamond', symbolSize: 12, itemStyle: { color: '#5d6470' }, data: closed });

    // open models on the front: labels stacked to the right of the cluster, with leader lines (paper style)
    const openFront = front.filter(m => !CLOSED[m.name]);
    if (!narrow) {
      const nano = openFront.find(m => m.b >= 10);
      const small = openFront.filter(m => m !== nano).reverse();
      const x0 = px(22), yTop = py(53);
      series.push({ name: 'front-labels', type: 'scatter', z: 3, silent: true, symbol: 'circle', symbolSize: 1, itemStyle: { color: 'rgba(0,0,0,0)' }, tooltip: { show: false },
        data: openFront.map(m => ({ name: m.name, value: [m.b, m.v] })),
        label: { show: true, color: '#3b4048', fontSize: 12.5, fontWeight: 650, fontFamily: FONT, lineHeight: 16,
          // Cosmos3-Nano sits close to the y axis: name on the first line, score on the second
          formatter: p => `${new RegExp(p.value[0] + 'B').test(p.name) ? p.name : `${p.name} (${p.value[0]}B)`}${p.value[0] >= 10 ? '\n' : ' · '}${p.value[1].toFixed(2)}` },
        labelLine: { show: true, lineStyle: { color: '#9aa1ab', width: 1 } },
        labelLayout: q => {
          const m = openFront[q.dataIndex];
          if (m === nano) return { x: px(m.b) - 10, y: py(m.v) - 8, align: 'center', verticalAlign: 'bottom' };
          return { x: x0, y: yTop + small.indexOf(m) * 20, align: 'left', verticalAlign: 'middle' };
        } });
    }

    series.push({ name: 'CameraVLM', type: 'scatter', symbolSize: 26, z: 4,
      symbol: 'path://M0,-12 L3,-4 L12,-4 L5,2 L8,11 L0,6 L-8,11 L-5,2 L-12,-4 L-3,-4 Z',
      itemStyle: { color: RED }, label: { show: true, position: 'top', distance: 10, formatter: p => (narrow ? 'CameraVLM ' : 'CameraVLM · 9B · ') + p.value[1].toFixed(2), color: RED, fontWeight: 800, fontSize: narrow ? 13 : 15, fontFamily: FONT },
      data: [{ name: 'CameraVLM', value: [9, ours.scores[metric]] }],
      markLine: { silent: true, symbol: 'none', lineStyle: { color: INK, type: 'dotted', width: 1.6 },
        label: { formatter: 'Human ' + human.scores[metric].toFixed(2), position: narrow ? 'insideMiddleBottom' : 'insideStartBottom', color: INK, fontSize: 12.5, fontWeight: 700, fontFamily: FONT },
        data: [{ yAxis: human.scores[metric] }] } });
    return {
      grid: G,
      tooltip: { ...base.tooltip, trigger: 'item', formatter: p => `<b>${p.name}</b><br>Accuracy ${p.value[1].toFixed(2)}%<br>Parameters ${p.data.est ? '≈' : ''}${p.value[0]}B${p.data.est ? ' (estimated, not public)' : ''}` },
      legend: { bottom: 0, left: 'center', itemWidth: 14, itemHeight: 10, itemGap: 14, textStyle: { fontSize: 12.5, color: '#454a52', fontFamily: FONT },
        data: ['General open-source', 'Geometry-aware', 'Camera-motion-specific', 'Closed-source (parameters estimated)', { name: 'Baseline Pareto front', icon: 'path://M0,4h5v2h-5z M7,4h5v2h-5z M14,4h5v2h-5z' }, 'CameraVLM'] },
      xAxis: { ...axis, type: 'log', min: 1, max: 10000, name: 'Total parameters (B, log scale)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 12.5, color: '#6a7079' }, axisLabel: { ...axis.axisLabel, formatter: v => v >= 1000 ? v / 1000 + 'k' : v } },
      yAxis: { ...axis, min: Y0, max: Y1, interval: 10, name: 'Average accuracy (%)', nameTextStyle: { fontSize: 12.5, color: '#6a7079', align: 'left' } },
      series
    };
  }

  // ---- left/right accuracy
  function leftRight(el) {
    const narrow = (el ? el.clientWidth : 800) < 480;
    const rows = C.directionPaper;
    const color = n => n === 'CameraVLM' ? RED : n === 'Human' ? INK : n === 'GPT-6 Astra' ? SLATE : GREY;
    return {
      grid: { left: 40, right: 12, top: 30, bottom: narrow ? 58 : 44 },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,.03)' } }, formatter: ps => `<b>${rows[ps[0].dataIndex][0]}</b><br>${Number(ps[0].value).toFixed(1)}%` },
      xAxis: { ...axis, type: 'category', data: rows.map(r => r[0].replace(' ', '\n')), axisLabel: { ...axis.axisLabel, interval: 0, fontSize: narrow ? 10.5 : 13, lineHeight: narrow ? 13 : 16, rotate: narrow ? 35 : 0, fontWeight: 550, color: '#454a52' } },
      yAxis: { ...axis, type: 'value', min: 0, max: 100, interval: 25 },
      series: [{ type: 'bar', barMaxWidth: 52, itemStyle: { borderRadius: [6, 6, 0, 0] },
        label: { show: true, position: 'top', fontSize: narrow ? 11.5 : 15, fontWeight: 700, color: INK, fontFamily: FONT, formatter: p => Number(p.value).toFixed(1) },
        data: rows.map(([n, v]) => ({ value: v, itemStyle: { color: color(n) } })),
        markLine: { silent: true, symbol: 'none', lineStyle: { color: '#c2321f', type: 'dotted', width: 1.5 }, label: { formatter: 'chance 50%', position: 'insideStartTop', color: '#c2321f', fontSize: 12.5, fontWeight: 600 }, data: [{ yAxis: 50 }] } }]
    };
  }

  // ---- quantitative: accuracy per camera-motion category, and pooled
  // distinct muted hues for the baselines; red stays reserved for CameraVLM, near-black for GPT-6 Astra
  const MODELS = [['Qwen3.5 (backbone)', 'Qwen3.5 backbone', '#cdd2d8'], ['Cambrian-P', 'Cambrian-P', '#93bfe3'], ['Cosmos3-Nano', 'Cosmos3-Nano', '#62ad98'],
    ['Claude Opus 4.8', 'Claude Opus 4.8', '#d8b46a'], ['Gemini 3.5 Flash', 'Gemini 3.5 Flash', '#8b86d6'], ['GPT-6 (high)', 'GPT-6 Astra', INK], ['Ours', 'CameraVLM', RED]];
  function category(el) {
    const narrow = (el ? el.clientWidth : 800) < 560;
    const { CATS, DATA } = C.categories;
    return {
      grid: { left: 40, right: 8, top: 30, bottom: narrow ? 50 : 34 },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,.03)' } }, valueFormatter: v => Number(v).toFixed(2) + '%' },
      xAxis: { ...axis, type: 'category', data: CATS, axisLabel: { ...axis.axisLabel, interval: 0, fontSize: narrow ? 11 : 14, rotate: narrow ? 40 : 0, fontWeight: 600, color: INK, margin: 10 } },
      yAxis: { ...axis, type: 'value', min: 0, max: 100, interval: 25 },
      series: MODELS.map(([k, name, col], i) => ({
        name, type: 'bar', barGap: '10%', barCategoryGap: '22%', itemStyle: { color: col, borderRadius: [3, 3, 0, 0] }, emphasis: { focus: 'series' },
        label: i === 6 && !narrow ? { show: true, position: 'top', fontSize: 12, fontWeight: 750, color: RED, fontFamily: FONT, formatter: p => Number(p.value).toFixed(0) } : { show: false },
        data: DATA[k]
      }))
    };
  }
  function overall() {
    const { OVERALL } = C.categories;
    return {
      grid: { left: 36, right: 8, top: 30, bottom: 70 },
      tooltip: { ...base.tooltip, trigger: 'item', formatter: p => `<b>${p.name}</b><br>${Number(p.value).toFixed(2)}%` },
      xAxis: { ...axis, type: 'category', data: MODELS.map(m => m[1].replace('Qwen3.5 backbone', 'Qwen3.5').replace('Gemini 3.5 Flash', 'Gemini Flash').replace('Claude Opus 4.8', 'Claude Opus').replace('Cosmos3-Nano', 'Cosmos3')), axisLabel: { ...axis.axisLabel, interval: 0, rotate: 40, fontSize: 11.5, fontWeight: 600, color: '#454a52' } },
      yAxis: { ...axis, type: 'value', min: 0, max: 100, interval: 25 },
      series: [{ type: 'bar', barWidth: '72%', itemStyle: { borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', fontSize: 12.5, fontWeight: 700, fontFamily: FONT, formatter: p => Number(p.value).toFixed(1) },
        data: MODELS.map(([k, name, col], i) => ({ name, value: OVERALL[k], itemStyle: { color: col }, label: { color: i === 6 ? RED : INK } })) }]
    };
  }

  let asked = false;
  function init() {
    if (window.echarts) return mountAll();
    const go = () => {
      if (asked) return; asked = true;
      const s = document.createElement('script'); s.src = 'assets/vendor/echarts.min.js'; s.onload = mountAll; document.head.appendChild(s);
    };
    if (location.hash || scrollY > 200 || document.readyState === 'complete') return go();
    addEventListener('load', go, { once: true });
    addEventListener('scroll', go, { once: true, passive: true });
    setTimeout(go, 1500);
  }
  function mountAll() {
    mount('chart-scatter', scatter, true);
    mount('chart-lr', leftRight, true);
    mount('chart-cat', category, true);
    mount('chart-overall', overall);
    legend('legend-cat', MODELS.map(m => [m[1], m[2]]));
    document.querySelectorAll('[data-seg="scatter"] button').forEach(b => b.addEventListener('click', () => {
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      metric = Number(b.dataset.v);
      charts['chart-scatter'] && charts['chart-scatter'].setOption({ ...base, ...scatter($('chart-scatter')) }, { notMerge: true });
    }));
  }
  function resizeIn(root) {
    Object.entries(charts).forEach(([id, c]) => { if (!root || root.contains($(id))) c.resize(); });
  }
  window.CVCharts = { init, resizeIn, charts };
})();
