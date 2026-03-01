import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'node:util'

// Polyfill TextEncoder/TextDecoder for MSW in Jest environment
if (typeof globalThis.TextEncoder === 'undefined') {
  // @ts-expect-error - Adding to global for MSW
  globalThis.TextEncoder = TextEncoder
}
if (typeof globalThis.TextDecoder === 'undefined') {
  // @ts-expect-error - Adding to global for MSW
  globalThis.TextDecoder = TextDecoder
}

// Polyfill BroadcastChannel for MSW in Node.js environment
if (typeof globalThis.BroadcastChannel === 'undefined') {
  // @ts-expect-error - Adding to global for MSW
  globalThis.BroadcastChannel = class BroadcastChannel {
    constructor(_name: string) {}
    postMessage(_message: unknown) {}
    close() {}
    onmessage: ((event: { data: unknown }) => void) | null = null
  }
}

// Polyfill Response, Headers, Request for MSW in Node.js environment
// @ts-expect-error - Adding Response to global for MSW
globalThis.Response = class Response {
  constructor(
    public body?: BodyInit | null,
    public init?: ResponseInit
  ) {}
}

// @ts-expect-error - Adding Headers to global for MSW
globalThis.Headers = class Headers {
  constructor(init?: HeadersInit) {}
}

// @ts-expect-error - Adding Request to global for MSW
globalThis.Request = class Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {}
}

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.alert
window.alert = jest.fn()

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))
