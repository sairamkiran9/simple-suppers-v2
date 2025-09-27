import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'

// Mock the theme hook
const mockSetTheme = jest.fn()
const mockUseTheme = {
  theme: 'light' as 'light' | 'dark' | 'system',
  resolvedTheme: 'light' as 'light' | 'dark',
  setTheme: mockSetTheme,
}

jest.mock('../../lib/theme', () => ({
  useTheme: () => mockUseTheme,
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear()
    mockUseTheme.theme = 'light'
    mockUseTheme.resolvedTheme = 'light'
  })

  it('renders theme toggle button', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('theme-toggle')
  })

  it('shows correct icon for light theme', () => {
    mockUseTheme.theme = 'light'
    mockUseTheme.resolvedTheme = 'light'

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Current theme: Light')
  })

  it('shows correct icon for dark theme', () => {
    mockUseTheme.theme = 'dark'
    mockUseTheme.resolvedTheme = 'dark'

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Current theme: Dark')
  })

  it('shows correct icon for system theme', () => {
    mockUseTheme.theme = 'system'
    mockUseTheme.resolvedTheme = 'light'

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Current theme: System')
  })

  it('cycles through themes when clicked', () => {
    mockUseTheme.theme = 'light'

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('cycles from dark to system theme', () => {
    mockUseTheme.theme = 'dark'

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })

  it('cycles from system to light theme', () => {
    mockUseTheme.theme = 'system'

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('has correct accessibility label', () => {
    mockUseTheme.theme = 'light'

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')
  })

  it('updates accessibility label based on current theme', () => {
    mockUseTheme.theme = 'dark'

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to system theme')
  })
})