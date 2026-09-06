export function extractFileName(filePath: string, stripExt = true): string {
  const name = filePath.replace(/.*[/\\]/, '')
  if (!stripExt) return name
  const stripped = name.replace(/\.\w+$/, '')
  // '.gitignore' 这类无基名的文件剥扩展名会得到空串，保留原名
  return stripped || name
}

/** 若目标路径已存在，自动追加 (1)、(2)… 后缀直到可用 */
export async function uniquePath(
  filePath: string,
  exists: (p: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(filePath))) return filePath
  const i = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'))
  const dir = i > 0 ? filePath.slice(0, i + 1) : ''
  const name = filePath.slice(i + 1)
  const dot = name.lastIndexOf('.')
  // '.gitignore' 这类以点开头的名字视为无扩展名
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  for (let n = 1; ; n++) {
    const candidate = `${dir}${stem}(${n})${ext}`
    if (!(await exists(candidate))) return candidate
  }
}
