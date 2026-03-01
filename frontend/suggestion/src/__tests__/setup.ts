/// <reference types="node" />
import { TextEncoder, TextDecoder } from 'node:util'

if (typeof globalThis.TextEncoder === 'undefined') {
  ;(globalThis as typeof globalThis & { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder
}
if (typeof globalThis.TextDecoder === 'undefined') {
  ;(globalThis as typeof globalThis & { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder as typeof globalThis.TextDecoder
}

// SWC transforms import.meta.env → process.env; set default for tests
if (typeof process.env.VITE_API_URL === 'undefined') {
  process.env.VITE_API_URL = 'http://localhost:3001'
}

import '@testing-library/jest-dom'
