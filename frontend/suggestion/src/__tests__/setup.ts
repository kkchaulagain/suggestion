/// <reference types="node" />
import { TextEncoder, TextDecoder } from 'node:util'

if (typeof globalThis.TextEncoder === 'undefined') {
  ;(globalThis as typeof globalThis & { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder
}
if (typeof globalThis.TextDecoder === 'undefined') {
  ;(globalThis as typeof globalThis & { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder as typeof globalThis.TextDecoder
}

// Jest runs in Node and doesn't support import.meta.env; mock apipath so tests don't load the real module
jest.mock('../utils/apipath', () => ({
  userapi: 'http://localhost:3001/api/auth/register',
  loginapi: 'http://localhost:3001/api/auth/login',
  meapi: 'http://localhost:3001/api/auth/me',
  businessmeapi: 'http://localhost:3001/api/auth/business',
}))

import '@testing-library/jest-dom'
