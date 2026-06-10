export function extractFileName(filePath: string, stripExt = true): string {
  const name = filePath.replace(/.*[/\\]/, '')
  return stripExt ? name.replace(/\.\w+$/, '') : name
}
