const steps = require('./launcher-steps')
module.exports = {
  run: [{
    method: "shell.run",
    params: {
      message: "git pull"
    }
  }, steps.remove, {
    when: "{{exists('app/.git')}}",
    method: "shell.run",
    params: { path: "app", message: ["git fetch origin", `git checkout ${steps.revision}`] }
  }, steps.apply, {
    method: "script.start",
    params: { uri: "install.js" }
  }]
}
