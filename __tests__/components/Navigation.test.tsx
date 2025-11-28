import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '@/components/Navigation'
import { ViewType } from '@/lib/types'

// Mock the ThemeToggle component
jest.mock('../../components/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <button data-testid="theme-toggle">Theme Toggle</button>
  }
})

// Mock the useAuth hook
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: jest.fn(),
  })
}))

describe('Navigation', () => {
  const mockOnViewChange = jest.fn();
  const mockOnLoginClick = jest.fn();

  beforeEach(() => {
    mockOnViewChange.mockClear();
    mockOnLoginClick.mockClear();
  });

  it('renders the brand logo and nav texts for non-authenticated users', () => {
    render(
      <Navigation
        currentView="landing"
        onViewChange={mockOnViewChange}
        onLoginClick={mockOnLoginClick}
      />
    );

    expect(screen.getByText('Simple Suppers')).toBeInTheDocument();
    expect(screen.getByText('Browse Plans')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('highlights the current active view', () => {
    render(
      <Navigation
        currentView="browse"
        onViewChange={mockOnViewChange}
        onLoginClick={mockOnLoginClick}
      />
    );

    const browseButton = screen.getByText('Browse Plans');
    expect(browseButton).toHaveClass('active');

    const homeButton = screen.getByText('Home');
    expect(homeButton).not.toHaveClass('active');
  });

  it('calls onViewChange when a nav button is clicked', () => {
    render(
      <Navigation
        currentView="landing"
        onViewChange={mockOnViewChange}
        onLoginClick={mockOnLoginClick}
      />
    );

    const browseButton = screen.getByText('Browse Plans');
    fireEvent.click(browseButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('browse');
  });

  it('renders the theme toggle component', () => {
    render(
      <Navigation
        currentView="landing"
        onViewChange={mockOnViewChange}
        onLoginClick={mockOnLoginClick}
      />
    );

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('handles all view types correctly', () => {
    const views: ViewType[] = ['landing', 'browse', 'creator', 'dashboard', 'feed'];

    views.forEach(view => {
      render(
        <Navigation
          currentView={view}
          onViewChange={mockOnViewChange}
          onLoginClick={mockOnLoginClick}
        />
      );

      // Find the button that should be active
      const navButtons = screen.getAllByRole('button');
      const activeButton = navButtons.find(button =>
        button.classList.contains('active') &&
        !button.hasAttribute('data-testid') // Exclude theme toggle
      );

      expect(activeButton).toBeInTheDocument();
    });
  });
});
