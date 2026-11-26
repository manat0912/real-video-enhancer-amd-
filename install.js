const steps = require('./launcher-steps')
const nativeROCm = "platform === 'win32' && (gpu === 'amd' || (Array.isArray(gpus) && gpus.some(g => /amd|radeon|advanced micro devices/i.test(typeof g === 'string' ? g : g.name + ' ' + g.model))))"
const environment = "{{" + nativeROCm + " ? 'env-rocm' : 'env'}}"
module.exports = {
  requires: { bundle: "ai" },
  run: [
    {
      when: "{{!exists('app/app.py') && !exists('app/REAL-Video-Enhancer.py')}}",
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/TNTwise/REAL-Video-Enhancer.git app",
        ]
      }
    },
    {
      when: "{{!exists('app/app.py') && exists('app/.git')}}",
      method: "shell.run",
      params: { path: "app", message: `git checkout ${steps.revision}` }
    },
    {
      when: "{{!exists('app/app.py')}}",
      method: "fs.copy",
      params: { src: "app/REAL-Video-Enhancer.py", dest: "app/app.py" }
    },
    steps.apply,
    {
      when: "{{(" + nativeROCm + ") && !exists('app/env-rocm/Scripts/python.exe')}}",
      method: "shell.run",
      params: { message: "uv venv --python 3.12 app/env-rocm" }
    },
    {
      method: "shell.run",
      params: {
        venv: environment,
        path: "app",
        message: [
          "uv pip install -r requirements.txt",
          "uv pip install -r backend/requirements.txt",
          "pyside6-uic -g python testRVEInterface.ui > mainwindow.py",
          "pyside6-rcc -g python resources.qrc > resources_rc.py"
        ]
      }
    },
    {
      method: "fs.write",
      params: {
        path: "app/models/placeholder.txt",
        text: "This folder contains downloaded models."
      }
    },
    {
      when: "{{!exists('app/models/rife4.26.pkl')}}",
      method: "fs.download",
      params: {
        uri: "https://github.com/TNTwise/real-video-enhancer-models/releases/download/models/rife-v4.26.tar.gz",
        path: "app/models/rife-v4.26.tar.gz"
      }
    },
    {
      when: "{{!exists('app/models/rife4.26.pkl')}}",
      method: "shell.run",
      params: {
        path: "app/models",
        message: [
          "tar -xzvf rife-v4.26.tar.gz"
        ]
      }
    },
    {
      method: "script.start",
      params: {
        uri: "torch.js",
        params: {
          venv: environment,
          path: "app",
        }
      }
    },
    {
      method: "shell.run",
      params: {
        venv: environment,
        path: "app",
        message: ["uv pip install \"accelerate>=1.12,<2\"", "python scripts/check_acceleration.py {{" + nativeROCm + " ? '--mark-ready' : ''}}"]
      }
    }
  ]
}
