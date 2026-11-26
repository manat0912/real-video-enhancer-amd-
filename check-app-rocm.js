module.exports = {
  "requires": {
    "bundle": "ai"
  },
  "run": [
    {
      "method": "shell.run",
      "params": {
        "path": "app",
        "message": "python ../rocm-retained-check.py",
        "venv": "env-rocm"
      }
    }
  ]
};
