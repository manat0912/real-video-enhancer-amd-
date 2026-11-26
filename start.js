module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "{{exists('app/env-rocm/.ready') ? 'env-rocm' : 'env'}}",
        path: "app",
        env: {
          RVE_USE_LAUNCHER_PYTHON: "1",
          RVE_DEFAULT_FAST_INFERENCE: "{{exists('app/env-rocm/.ready') ? '1' : '0'}}"
        },
        message: [
          "python app.py",
        ]
      }
    }
  ]
}
