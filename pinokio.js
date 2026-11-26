module.exports = {
  version: "5.0",
  menu: async (kernel, info) => {
    const scripts = [
      ["install.js", "Installing native environment"],
      ["start.js", "Native app running — terminal"],
      ["update.js", "Updating"], ["reset.js", "Resetting"],
      ["link.js", "Deduplicating"],
    ]
    for (const [script, text] of scripts) {
      if (info.running(script)) {
        return [{ default: true, icon: "fa-solid fa-terminal", text, href: script }]
      }
    }
    const rocm = info.exists("app/env-rocm/.ready")
    const installed = rocm || info.exists("app/env")
    const items = []
    if (installed) items.push({ default: true, icon: "fa-solid fa-power-off", text: rocm ? "Start native AMD (ROCm)" : "Start native app", href: "start.js" })
    items.push({ default: !installed, icon: "fa-solid fa-plug", text: "Install / upgrade native GPU support", href: "install.js" })
    if (installed) items.push(
      { icon: "fa-solid fa-rotate", text: "Update", href: "update.js" },
      { icon: "fa-solid fa-file-zipper", text: "Save disk space", href: "link.js" },
      { icon: "fa-regular fa-circle-xmark", text: "Reset native installation", href: "reset.js", confirm: "Remove the native environments and downloaded models?" })
    return items
  }
}
