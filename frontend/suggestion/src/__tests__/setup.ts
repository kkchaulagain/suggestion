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
import React from 'react'

// Recharts ResponsiveContainer measures its parent; in jsdom there is no layout so it gets -1 and warns.
// Mock it to render a fixed-size container so chart tests run without the warning.
jest.mock('recharts', () => {
  const actual = jest.requireActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: (props: { children?: React.ReactNode; width?: string | number; height?: string | number }) => {
      const w = typeof props.width === 'number' ? props.width : 400
      const h = typeof props.height === 'number' ? props.height : 300
      return React.createElement('div', { style: { width: w, height: h } }, props.children)
    },
  }
})
