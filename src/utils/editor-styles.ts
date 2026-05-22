export function applyEditorStyles(fs: number, ew: number, lw: boolean) {
  const root = document.documentElement
  root.style.setProperty('--editor-font-size', `${fs}px`)
  root.style.setProperty('--editor-max-width', `${ew}px`)
  root.style.setProperty('--editor-white-space', lw ? 'normal' : 'pre')
  root.style.setProperty('--editor-overflow-wrap', lw ? 'break-word' : 'normal')
  root.style.setProperty('--heading-h1-size', `${fs + 12}px`)
  root.style.setProperty('--heading-h2-size', `${fs + 8}px`)
  root.style.setProperty('--heading-h3-size', `${fs + 4}px`)
  root.style.setProperty('--heading-h4-size', `${fs + 2}px`)
  root.style.setProperty('--heading-h5-size', `${fs}px`)
  root.style.setProperty('--heading-h6-size', `${fs - 2}px`)
  root.style.setProperty('--table-font-size', `${Math.max(12, fs - 3)}px`)
}
