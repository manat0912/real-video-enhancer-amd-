# REAL Video Enhancer for Pinokio

Upscale, restore, and interpolate local video with the [REAL Video Enhancer](https://github.com/TNTwise/REAL-Video-Enhancer) desktop app. Pinokio manages the app's Python environment. On supported Windows AMD GPUs it installs native ROCm in `app/env-rocm`, alongside any existing `app/env` install.

## Start on Windows with AMD

1. Select **Install / upgrade native GPU support** if **Start native AMD (ROCm)** is missing. Install declares the Pinokio AI bundle and only registers the ROCm environment after an FP16 GPU convolution passes.
2. Select **Start native AMD (ROCm)**, then **pytorch (rocm)** in Processing. **Acceleration → AMD acceleration and rendering speed → Check GPU acceleration** reports the actual GPU, runtime, FP16 result, and Accelerate version.
3. Start with **Fast**, **auto** precision, and a compact model such as **2x OpenProteus Compact**. In Settings, choose an AMD hardware encoder such as **h264_amf** and **fastest** encoder speed. These are independent settings: ROCm handles model inference and AMF handles video encoding.
4. Render a short sample with the intended resolution and models before queuing a movie. The **Tuned** profile searches for faster convolution kernels but may spend longer starting. **Compatibility** uses the standard model layout. The **Benchmark** checkbox measures processing without saving a movie.

The Windows path is pinned to AMD's [ROCm 7.2.1 PyTorch release](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/install/installrad/windows/install-pytorch.html) and Python 3.12. Check the [Windows compatibility matrix](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/compatibility/compatibilityrad/windows/windows_compatibility.html) for driver and GPU requirements. If ROCm is unavailable, NCNN uses Vulkan with its own model set. Accelerate handles device transfers when enabled; it does not make every model faster by itself.

### Measured on Radeon AI PRO R9700 (32 GB)

| Workload | Measurement | Throughput |
| --- | --- | ---: |
| OpenProteus Compact, 320×180 → 640×360, Fast + H.264 AMF | Full decode, inference and encode, 240 frames | 88.9 FPS |
| OpenProteus Compact, 640×360 → 1280×720, Fast + H.264 AMF | Full decode, inference and encode, 240 frames | 74.8 FPS |
| OpenProteus Compact, 640×360 → 1280×720, Fast FP16 | Warm model only | 152.2 FPS |
| OpenProteus Compact, 640×360 → 1280×720, tuned FP16 | Warm model only | 213.7 FPS |
| OpenProteus Compact, 1920×1080 → 3840×2160, Fast FP16 | Warm model only | 18.6 FPS |
| DnCNN restoration, 640×360, Fast FP16 | Warm model only | 82.0 FPS |
| SCUNet restoration, 640×360, tuned FP16 | Warm model only | 9.6 FPS |

These runs used a generated clip or synthetic tensors. The model-only measurements exclude per-frame transfers and video I/O. Clip runtime also includes startup. Denoising, restoration, interpolation, HDR, and the encoder choice can change throughput.

**AMD FSR Upscaling 4.1** and **DLSS 5 / DLSS-NR-on-AMD** appear as unavailable in the Acceleration dialog. [AMD's FSR SDK](https://gpuopen.com/manuals/fsr_sdk/) expects renderer inputs such as depth, motion vectors and jitter. The [linked DLSS project](https://github.com/danielblnc/DLSS-NR-on-AMD) hooks DirectX 12 games and does not expose an offline video interface.

## Local command-line API

From `app` in PowerShell, check the installed runtime or measure an installed upscaler:

```powershell
.\env-rocm\Scripts\python.exe scripts/check_acceleration.py --require-rocm
.\env-rocm\Scripts\python.exe scripts/benchmark_upscale.py --model models/2x_OpenProteus_Compact_i2_70K.pth --width 640 --height 360 --frames 96 --profile fast
```

Render programmatically through the same Python backend. Use `--help` for the interpolation, restoration, and encoder options:

```powershell
.\env-rocm\Scripts\python.exe backend/rve-backend.py -i input.mp4 -o output.mp4 -b pytorch --precision float16 --upscale_model models/2x_OpenProteus_Compact_i2_70K.pth --ffmpeg_path bin/ffmpeg.exe
```

From JavaScript, run the same CLI with `child_process.spawn`, using the app directory as the working directory:

```javascript
const { spawn } = require("node:child_process")
spawn("env-rocm/Scripts/python.exe", ["backend/rve-backend.py", "--list_backends"], {
  cwd: appDirectory, stdio: "inherit"
})
```

RVE is a local Qt app without an HTTP API; there is no cURL endpoint. The launcher keeps the upstream app revision and the [AMD support patch](patches/amd-support.patch) together so a fresh install can reproduce the source changes.

