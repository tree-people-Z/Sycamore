export function extractFileName(filePath: string, stripExt = true): string {
  const name = filePath.replace(/.*[/\\]/, '')
  if (!stripExt) return name
  const stripped = name.replace(/\.\w+$/, '')
  // '.gitignore' 这类无基名的文件剥扩展名会得到空串，保留原名
  return stripped || name
}
