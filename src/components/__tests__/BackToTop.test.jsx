import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BackToTop from '../BackToTop'

describe('BackToTop Component - Unit Tests', () => {
  let scrollToSpy

  beforeEach(() => {
    // Mock window.scrollTo
    scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy

    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: Component renders
  it('renders the back to top button', () => {
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    expect(button).toBeInTheDocument()
  })

  // Test 2: Button has correct aria-label
  it('has correct aria-label for accessibility', () => {
    render(<BackToTop />)
    
    const button = screen.getByLabelText('Back to top')
    expect(button).toBeInTheDocument()
  })

  // Test 3: Button is hidden initially when scrollY is 0
  it('is hidden when page is at top', () => {
    window.scrollY = 0
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    expect(button).not.toHaveClass('show')
  })

  // Test 4: Button is hidden when scroll is less than viewport height
  it('is hidden when scrolled less than viewport height', () => {
    window.scrollY = 500 // Less than innerHeight (800)
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    expect(button).not.toHaveClass('show')
  })

  // Test 5: Button shows when scrolled past viewport height
  it('shows when scrolled past viewport height', async () => {
    window.scrollY = 900 // Greater than innerHeight (800)
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    
    // Trigger scroll event
    fireEvent.scroll(window)
    
    await waitFor(() => {
      expect(button).toHaveClass('show')
    })
  })

  // Test 6: Shows exactly at viewport height boundary
  it('shows when scrollY equals viewport height + 1', async () => {
    window.scrollY = 801 // Just past innerHeight (800)
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    
    fireEvent.scroll(window)
    
    await waitFor(() => {
      expect(button).toHaveClass('show')
    })
  })

  // Test 7: Button scrolls to top when clicked
  it('scrolls to top when button is clicked', () => {
    window.scrollY = 1000
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    fireEvent.click(button)
    
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    })
  })

  // Test 8: Scroll listener is added on mount
  it('adds scroll event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    
    render(<BackToTop />)
    
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    )
    
    addEventListenerSpy.mockRestore()
  })

  // Test 9: Scroll listener is removed on unmount
  it('removes scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    
    const { unmount } = render(<BackToTop />)
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
    
    removeEventListenerSpy.mockRestore()
  })

  // Test 10: Button visibility toggles on scroll changes
  it('toggles visibility as user scrolls up and down', async () => {
    window.scrollY = 0
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    
    // Initially hidden
    expect(button).not.toHaveClass('show')
    
    // Scroll down past threshold
    window.scrollY = 1000
    fireEvent.scroll(window)
    
    await waitFor(() => {
      expect(button).toHaveClass('show')
    })
    
    // Scroll back to top
    window.scrollY = 500
    fireEvent.scroll(window)
    
    await waitFor(() => {
      expect(button).not.toHaveClass('show')
    })
  })

  // Test 11: SVG icon is present
  it('contains an SVG icon', () => {
    render(<BackToTop />)
    
    const svg = screen.getByRole('img', { name: /back to top/i })
    expect(svg).toBeInTheDocument()
  })

  // Test 12: SVG has proper accessibility attributes
  it('SVG has proper accessibility attributes', () => {
    render(<BackToTop />)
    
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-hidden', 'false')
    expect(svg).toHaveAttribute('focusable', 'false')
  })

  // Test 13: Button is keyboard accessible
  it('is keyboard accessible', () => {
    window.scrollY = 1000
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    
    // Tab to button and press Enter
    button.focus()
    expect(button).toHaveFocus()
    
    fireEvent.keyDown(button, { key: 'Enter' })
    fireEvent.click(button)
    
    expect(scrollToSpy).toHaveBeenCalled()
  })

  // Test 14: Multiple scroll events handled correctly
  it('handles multiple rapid scroll events', async () => {
    window.scrollY = 0
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    
    // Rapid scroll events
    window.scrollY = 400
    fireEvent.scroll(window)
    
    window.scrollY = 600
    fireEvent.scroll(window)
    
    window.scrollY = 900
    fireEvent.scroll(window)
    
    await waitFor(() => {
      expect(button).toHaveClass('show')
    })
  })

  // Test 15: Uses passive scroll listener for performance
  it('uses passive scroll listener option', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    
    render(<BackToTop />)
    
    const passiveListenerCall = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'scroll'
    )
    
    expect(passiveListenerCall[2]).toEqual({ passive: true })
    
    addEventListenerSpy.mockRestore()
  })

  // Test 16: Initial scroll position is checked on mount
  it('checks scroll position immediately on mount', () => {
    window.scrollY = 1200 // Already scrolled
    
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    
    // Should show immediately without needing a scroll event
    expect(button).toHaveClass('show')
  })

  // Test 17: Button maintains accessibility when hidden
  it('maintains accessibility even when hidden', () => {
    window.scrollY = 0
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    
    // Still in DOM and accessible, just visually hidden via CSS
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Back to top')
  })

  // Test 18: Button has proper CSS classes
  it('has proper CSS classes', () => {
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    expect(button).toHaveClass('backtotop')
  })

  // Test 19: Button can be clicked multiple times
  it('can be clicked multiple times', () => {
    window.scrollY = 1000
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    
    fireEvent.click(button)
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    
    fireEvent.click(button)
    expect(scrollToSpy).toHaveBeenCalledTimes(2)
    
    fireEvent.click(button)
    expect(scrollToSpy).toHaveBeenCalledTimes(3)
  })

  // Test 20: Smooth scroll behavior is specified
  it('specifies smooth scroll behavior', () => {
    window.scrollY = 1000
    render(<BackToTop />)
    
    const button = screen.getByRole('button', { name: /back to top/i })
    fireEvent.click(button)
    
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
      })
    )
  })
})
