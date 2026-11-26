// Shared Pinokio steps. Source patches are checked before applying, so unrelated
// local modifications cause a useful failure instead of being overwritten.
const applyCode = "const cp=require('child_process'); const patch='patches/amd-support.patch'; const args=['apply','--directory=app','--ignore-space-change']; const check=(extra)=>cp.spawnSync('git',[...args,...extra,patch],{stdio:'pipe'}).status===0; if(check(['--reverse','--check'])) { console.log('AMD patch already installed'); } else { if(!check(['--check'])) throw new Error('AMD patch does not match this app revision. Keep local changes and inspect the patch before updating.'); const r=cp.spawnSync('git',[...args,patch],{stdio:'inherit'}); process.exit(r.status ?? 1); }"
const removeCode = "const cp=require('child_process'); const args=['apply','--directory=app','--ignore-space-change','--reverse']; const patch='patches/amd-support.patch'; const r=cp.spawnSync('git',[...args,'--check',patch],{stdio:'pipe'}); if(r.status!==0) throw new Error('Cannot safely remove AMD patch; preserve local changes and review before updating.'); process.exit(cp.spawnSync('git',[...args,patch],{stdio:'inherit'}).status ?? 1)"
module.exports = {
  revision: "8541c46ca14e6f84fc86c5b9d3b75373e25732e5",
  apply: { method: "shell.run", params: { message: `node -e "${applyCode}"` } },
  remove: { when: "{{exists('app/.git')}}", method: "shell.run", params: { message: `node -e "${removeCode}"` } },
}
