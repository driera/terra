import { render, screen, act } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePointer } from '../../api'
import Coordinates from './Coordinates'

vi.mock('../../api')

expect.extend(toHaveNoViolations)

const axe = configureAxe()

describe('Coordinates', () => {
  beforeEach(() => {
    vi.mocked(usePointer).mockReset()
  })

  it('renders nothing when coordinates are null', () => {
    vi.mocked(usePointer).mockReturnValue({ coordinates: null })
    const { container } = render(<Coordinates />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders coordinates in degree/direction format', () => {
    vi.mocked(usePointer).mockReturnValue({ coordinates: [2.1734, 41.3851] })
    render(<Coordinates />)
    expect(screen.getByText('41.3851° N')).toBeInTheDocument()
    expect(screen.getByText('2.1734° E')).toBeInTheDocument()
  })

  it('renders S and W for negative coordinates', () => {
    vi.mocked(usePointer).mockReturnValue({ coordinates: [-73.9857, -40.7128] })
    render(<Coordinates />)
    expect(screen.getByText('40.7128° S')).toBeInTheDocument()
    expect(screen.getByText('73.9857° W')).toBeInTheDocument()
  })

  it('rounds values to 4 decimal places', () => {
    vi.mocked(usePointer).mockReturnValue({ coordinates: [2.17345678, 41.38516789] })
    render(<Coordinates />)
    expect(screen.getByText('41.3852° N')).toBeInTheDocument()
    expect(screen.getByText('2.1735° E')).toBeInTheDocument()
  })

  it('has no a11y violations when showing coordinates', async () => {
    vi.mocked(usePointer).mockReturnValue({ coordinates: [2.1734, 41.3851] })
    const { container } = render(<Coordinates />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
