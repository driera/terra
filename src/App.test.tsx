import { render } from '@testing-library/react'
import { act } from 'react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import maplibregl from 'maplibre-gl'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

expect.extend(toHaveNoViolations)

const axe = configureAxe()

vi.mock('maplibre-gl', async (importOriginal) => {
  const actual = await importOriginal<typeof maplibregl>()
  return {
    ...actual,
    default: {
      ...actual,
      Map: vi.fn().mockImplementation(function () {
        return { remove: vi.fn(), on: vi.fn(), once: vi.fn(), addSource: vi.fn(), addLayer: vi.fn(), isStyleLoaded: vi.fn(() => true) }
      }),
    },
  }
})

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<App />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
