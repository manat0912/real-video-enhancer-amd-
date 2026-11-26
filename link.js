module.exports = {
  run: [
    {
      method: "fs.link",
      params: {
      venv: "{{exists('app/env-rocm/.ready') ? 'app/env-rocm' : 'app/env'}}"
      }
    }
  ]
}
