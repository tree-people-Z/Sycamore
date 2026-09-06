import { describe, it, expect } from 'vitest'
import { fileLanguageId, CODE_FILE_EXTENSIONS } from '../ide-language'

describe('fileLanguageId', () => {
  it('should map common extensions to language ids', () => {
    expect(fileLanguageId('index.ts')).toBe('typescript')
    expect(fileLanguageId('app.tsx')).toBe('typescript')
    expect(fileLanguageId('main.js')).toBe('javascript')
    expect(fileLanguageId('script.py')).toBe('python')
    expect(fileLanguageId('page.html')).toBe('html')
    expect(fileLanguageId('style.css')).toBe('css')
    expect(fileLanguageId('data.json')).toBe('json')
    expect(fileLanguageId('README.md')).toBe('markdown')
    expect(fileLanguageId('main.go')).toBe('go')
    expect(fileLanguageId('lib.rs')).toBe('rust')
    expect(fileLanguageId('run.sh')).toBe('shell')
    expect(fileLanguageId('cfg.yaml')).toBe('yaml')
  })

  it('should map c-family extensions', () => {
    expect(fileLanguageId('a.c')).toBe('c')
    expect(fileLanguageId('a.h')).toBe('c')
    expect(fileLanguageId('a.cpp')).toBe('cpp')
    expect(fileLanguageId('A.CC')).toBe('cpp')
    expect(fileLanguageId('Main.java')).toBe('java')
  })

  it('should return null for unknown or extensionless names', () => {
    expect(fileLanguageId('notes.txt')).toBeNull()
    expect(fileLanguageId('Makefile')).toBeNull()
    expect(fileLanguageId('')).toBeNull()
  })

  it('should be case-insensitive on extension', () => {
    expect(fileLanguageId('README.MD')).toBe('markdown')
    expect(fileLanguageId('Main.TS')).toBe('typescript')
  })
})

describe('CODE_FILE_EXTENSIONS', () => {
  it('should be lowercase without dots and unique', () => {
    const set = new Set(CODE_FILE_EXTENSIONS)
    expect(set.size).toBe(CODE_FILE_EXTENSIONS.length)
    for (const ext of CODE_FILE_EXTENSIONS) {
      expect(ext).toBe(ext.toLowerCase())
      expect(ext.startsWith('.')).toBe(false)
      expect(ext.trim()).toBe(ext)
    }
  })

  it('should include common code extensions', () => {
    for (const ext of ['ts', 'js', 'py', 'go', 'rs', 'json', 'md', 'html', 'css']) {
      expect(CODE_FILE_EXTENSIONS).toContain(ext)
    }
  })
})
