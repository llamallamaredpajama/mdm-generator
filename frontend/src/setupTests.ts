import { afterAll, beforeAll, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Suppress React Router v7 migration warnings in test output
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args: Parameters<typeof console.warn>) => {
    if (typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning')) return
    originalWarn(...args)
  }
})
afterAll(() => {
  console.warn = originalWarn
})

// Mock window.matchMedia for jsdom (used by useMediaQuery/useIsMobile)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

