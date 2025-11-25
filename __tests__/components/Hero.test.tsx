/**
 * Tests for Hero component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Hero from '@/components/Hero'

describe('Hero', () => {
  const mockOnViewChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render redesigned hero with new messaging', () => {
    render(<Hero onViewChange={mockOnViewChange} />)

    expect(screen.getByText('Discover meal plans from real home cooks')).toBeInTheDocument()
    expect(screen.getByText(/join a community where families share/i)).toBeInTheDocument()
  })

  it('should display social proof elements', () => {
    render(<Hero onViewChange={mockOnViewChange} />)

    expect(screen.getByText('Join 2,500+ families saving time & money')).toBeInTheDocument()
    expect(screen.getByText('"Changed how we do dinners" - Sarah M.')).toBeInTheDocument()
  })

  it('should render updated CTA buttons', () => {
    render(<Hero onViewChange={mockOnViewChange} />)

    expect(screen.getByRole('button', { name: /browse plans/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join community/i })).toBeInTheDocument()
  })

  it('should call onViewChange with browse when Browse Plans clicked', () => {
    render(<Hero onViewChange={mockOnViewChange} />)

    const browseButton = screen.getByRole('button', { name: /browse plans/i })
    fireEvent.click(browseButton)

    expect(mockOnViewChange).toHaveBeenCalledWith('browse')
    expect(mockOnViewChange).toHaveBeenCalledTimes(1)
  })

  it('should call onViewChange with provider when Join Community clicked', () => {
    render(<Hero onViewChange={mockOnViewChange} />)

    const joinButton = screen.getByRole('button', { name: /join community/i })
    fireEvent.click(joinButton)

    expect(mockOnViewChange).toHaveBeenCalledWith('provider')
    expect(mockOnViewChange).toHaveBeenCalledTimes(1)
  })

  it('should display hero background image', () => {
    render(<Hero onViewChange={mockOnViewChange} />)

    const heroImage = screen.getByAltText('Delicious home-cooked meal')
    expect(heroImage).toBeInTheDocument()
    expect(heroImage).toHaveAttribute('src', expect.stringContaining('unsplash.com'))
  })

  it('should display testimonial avatar', () => {
    render(<Hero onViewChange={mockOnViewChange} />)

    const avatar = screen.getByAltText('Sarah M.')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', expect.stringContaining('unsplash.com'))
  })

  it('should display star ratings', () => {
    render(<Hero onViewChange={mockOnViewChange} />)

    // Check for 5 star icons
    const stars = screen.getAllByTestId('star-icon')
    expect(stars).toHaveLength(5)
  })
})