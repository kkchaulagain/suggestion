import type { Preview } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { createElement } from 'react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => createElement(MemoryRouter, null, createElement(Story)),
  ],
}

export default preview