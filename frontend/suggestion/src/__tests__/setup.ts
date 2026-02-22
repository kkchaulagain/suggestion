/// <reference types="node" />
import { TextEncoder, TextDecoder } from 'node:util'

if (typeof globalThis.TextEncoder === 'undefined') {
  ;(globalThis as typeof globalThis & { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder
}
if (typeof globalThis.TextDecoder === 'undefined') {
  ;(globalThis as typeof globalThis & { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder as typeof globalThis.TextDecoder
}

import '@testing-library/jest-dom'
