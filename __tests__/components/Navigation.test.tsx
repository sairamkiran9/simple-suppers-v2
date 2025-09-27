import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '@/components/Navigation'
import { ViewType } from '@/lib/types'

// Mock the ThemeToggle component
jest.mock('../../components/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <button data-testid="theme-toggle">Theme Toggle</button>
  }
})

describe('Navigation', () => {
  const mockOnViewChange = jest.fn()

  beforeEach(() => {
    mockOnViewChange.mockClear()
  })

  it('renders the brand logo and text', () => {
    render(
      <Navigation currentView="landing" onViewChange={mockOnViewChange} />
    )

    expect(screen.getByText('Simple Suppers')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(
      <Navigation currentView="landing" onViewChange={mockOnViewChange} />
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Browse Plans')).toBeInTheDocument()
    expect(screen.getByText('For Providers')).toBeInTheDocument()
    expect(screen.getByText('My Account')).toBeInTheDocument()
  })

  it('highlights the current active view', () => {
    render(
      <Navigation currentView="browse" onViewChange={mockOnViewChange} />
    )

    const browseButton = screen.getByText('Browse Plans')
    expect(browseButton).toHaveClass('active')

    const homeButton = screen.getByText('Home')
    expect(homeButton).not.toHaveClass('active')
  })

  it('calls onViewChange when navigation item is clicked', () => {
    render(
      <Navigation currentView="landing" onViewChange={mockOnViewChange} />
    )

    const browseButton = screen.getByText('Browse Plans')
    fireEvent.click(browseButton)

    expect(mockOnViewChange).toHaveBeenCalledWith('browse')
  })

  it('renders the theme toggle component', () => {
    render(
      <Navigation currentView="landing" onViewChange={mockOnViewChange} />
    )

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('handles all view types correctly', () => {
    const views: ViewType[] = ['landing', 'browse', 'provider', 'dashboard']

    views.forEach(view => {
      render(
        <Navigation currentView={view} onViewChange={mockOnViewChange} />
      )

      // Find the button that should be active
      const navButtons = screen.getAllByRole('button')
      const activeButton = navButtons.find(button =>
        button.classList.contains('active') &&
        !button.hasAttribute('data-testid') // Exclude theme toggle
      )

      expect(activeButton).toBeInTheDocument()
    })
  })
})