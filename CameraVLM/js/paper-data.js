// Numbers transcribed from cameravlm-paper/main.tex (arXiv version).
window.PAPER = {
  // Table 1: camera-motion understanding accuracy (%). [model, params, CameraBench, CineTechBench, ShotBench, Avg]
  main: [
    { group: 'General open-source models', rows: [
      ['Qwen2.5-VL', '7B', 60.00, 48.67, 38.36, 49.01],
      ['Qwen3-VL', '8B', 62.30, 37.17, 40.73, 46.73],
      ['Qwen3.5 (backbone)', '9B', 63.64, 54.87, 46.98, 55.16],
      ['Qwen3.5 + CoT', '9B', 69.20, 53.98, 45.47, 56.22],
      ['Orca', '4B', 62.20, 52.21, 36.85, 50.42],
      ['DepthVLM', '4B', 59.30, 56.64, 40.09, 52.01],
      ['Cosmos3-Edge', '4B', 57.60, 56.64, 47.41, 53.88],
      ['Cosmos3-Nano', '16B', 70.30, 67.26, 57.33, 64.96],
      ['Hy-Embodied-VLM', '30B-A3B', 65.70, 53.10, 47.63, 55.48],
      ['RynnBrain1.1', '9B', 65.80, 56.64, 43.32, 55.25]
    ]},
    { group: 'Geometry-aware models', rows: [
      ['Cambrian-P', '7B', 64.30, 53.09, 48.06, 55.15],
      ['CamDistill', '8B', 40.60, 42.48, 43.97, 42.35],
      ['CamInject', '8B', 45.50, 46.90, 41.81, 44.74],
      ['Spatial-MLLM', '–', 57.70, 37.17, 32.11, 42.33],
      ['VLM-3R-7B', '7B', 57.00, 33.63, 39.66, 43.43]
    ]},
    { group: 'Camera-motion-specific models', rows: [
      ['CameraModel-7B', '7B', 70.90, 52.21, 44.83, 55.98],
      ['ACaM', '8B', 63.00, 57.52, 56.03, 58.85],
      ['CamReasoner-7B', '7B', 68.00, 48.67, 44.83, 53.83],
      ['ShotVL-7B', '7B', 66.10, 42.48, 61.21, 56.60]
    ]},
    { group: 'Closed-source models', rows: [
      ['Claude Opus 4.8', '–', 63.49, 54.87, 49.03, 55.80],
      ['Gemini 3.5 Flash', '–', 66.70, 61.95, 58.84, 62.50],
      ['GPT-6 Astra (high)', '–', 82.50, 83.19, 79.09, 81.59]
    ]},
    { group: null, rows: [['Human', '–', 76.19, 77.61, 87.34, 80.38]] },
    { group: null, ours: true, rows: [['CameraVLM (Ours)', '9B', 88.20, 77.88, 81.47, 82.52]] }
  ],
  // Table 4: ablation (10K iterations per stage; numbers lower than Table 1 by design).
  ablation: [
    ['Backbone', 63.64, 54.87, 46.98, 55.2],
    ['w/o Flow', 64.50, 55.75, 72.20, 64.1],
    ['w/o Camera & Flow', 67.20, 57.10, 42.10, 55.5],
    ['One-stage training', 64.50, 64.00, 53.88, 60.8],
    ['Full model', 68.20, 67.88, 70.79, 69.0]
  ]
};
