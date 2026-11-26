const assert = require('node:assert/strict')
const launcher = require('../pinokio')
async function menu(exists = [], running = []) {
  return launcher.menu({}, { exists: p => exists.includes(p), running: p => running.includes(p) })
}
async function main() {
  assert.equal((await menu())[0].href, 'install.js')
  assert.equal((await menu(['app/env']))[0].href, 'start.js')
  assert.match((await menu(['app/env-rocm/.ready']))[0].text, /ROCm/)
  for (const script of ['install.js', 'start.js', 'update.js', 'reset.js', 'link.js']) {
    const items = await menu(['app/env'], [script])
    assert.equal(items[0].href, script)
    assert.equal(items[0].default, true)
  }
  const install = require('../install')
  const environment = install.run.find(step => step.params?.venv)?.params.venv
  const resolveEnvironment = Function('platform', 'gpu', 'gpus', 'return ' + environment.slice(2, -2))
  const r9700 = { name: 'advanced micro devices, inc.', model: 'amd radeon ai pro r9700' }
  assert.equal(resolveEnvironment('win32', 'nvidia', [r9700]), 'env-rocm')
  assert.equal(resolveEnvironment('win32', 'nvidia', []), 'env')
  assert.equal(resolveEnvironment('linux', 'amd', [r9700]), 'env')
  console.log('Launcher menu state checks passed')
}
main().catch(error => { console.error(error); process.exit(1) })
