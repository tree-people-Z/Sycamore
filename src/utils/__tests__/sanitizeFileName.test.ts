import { describe, it, expect } from 'vitest'
import { sanitizeFileName } from '../../constants'

describe('sanitizeFileName', () => {
  it('should remove illegal characters', () => {
    expect(sanitizeFileName('hello:world')).toBe('helloworld')
    expect(sanitizeFileName('file<name>')).toBe('filename')
    expect(sanitizeFileName('test"file')).toBe('testfile')
  })

  it('should replace backslash and slash', () => {
    expect(sanitizeFileName('a/b/c')).toBe('abc')
    expect(sanitizeFileName('a\\b\\c')).toBe('abc')
  })

  it('should return fallback for empty or trimmed name', () => {
    expect(sanitizeFileName('')).toBe('未命名笔记')
    expect(sanitizeFileName('<>:"/\\|?*')).toBe('未命名笔记')
  })

  it('should allow valid file names', () => {
    expect(sanitizeFileName('my-notes-2024')).toBe('my-notes-2024')
    expect(sanitizeFileName('Hello World')).toBe('Hello World')
  })
})
