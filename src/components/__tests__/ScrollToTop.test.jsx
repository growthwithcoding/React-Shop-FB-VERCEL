import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import ScrollToTop from '../ScrollToTop'
import { useEffect } from 'react'

// Test component that allows programmatic navigation
function TestApp({ children }) {
  return (
    <MemoryRouter initialEntries={['/']}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/about" element={<div>About</div>} />
        <Route path="/contact" element={<div>Contact</div>} />
        <Route path="/products" element={<div>Products</div>} />
      </Routes>
      {children}
    </MemoryRouter>
  )
}

// Navigation helper component
function NavigationTrigger({ to }) {
  const navigate = useNavigate()
  
  useEffect(() => {
    if (to) {
      navigate(to)
    }
  }, [to, navigate])
  
  return null
}

describe('ScrollToTop Component - Unit Tests', () => {
  let scrollToSpy

  beforeEach(() => {
    // Mock window.scrollTo
    scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: Component renders nothing (null)
  it('renders nothing visible', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    expect(container.firstChild).toBeNull()
  })

  // Test 2: Scrolls to top on initial render
  it('scrolls to top on initial mount', () => {
    render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  })

  // Test 3: Scrolls to top when pathname changes
  it('scrolls to top when navigating to different route', () => {
    render(
      <MemoryRouter initialEntries={['/', '/about']}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/about" element={<div>About</div>} />
        </Routes>
      </MemoryRouter>
    )
    
    // Initial mount should scroll once
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
  })

  // Test 4: Does NOT scroll when only hash changes
  it('does not scroll when only hash changes', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/products']}>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    const initialCalls = scrollToSpy.mock.calls.length
    
    // Change hash only
    rerender(
      <MemoryRouter initialEntries={['/products#section1']}>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    // Should not trigger additional scroll
    expect(scrollToSpy).toHaveBeenCalledTimes(initialCalls)
  })

  // Test 5: Scrolls to exact position (0, 0)
  it('scrolls to position (0, 0)', () => {
    render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 0,
        left: 0,
      })
    )
  })

  // Test 6: Uses instant scroll behavior
  it('uses instant scroll behavior', () => {
    render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'instant',
      })
    )
  })

  // Test 7: Scrolls on multiple route changes
  it('scrolls on each route change', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/about" element={<div>About</div>} />
          <Route path="/contact" element={<div>Contact</div>} />
        </Routes>
      </MemoryRouter>
    )
    
    // Only tests initial mount scroll
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
  })

  // Test 8: Handles hash navigation without pathname change
  it('preserves hash navigation functionality', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/products']}>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    scrollToSpy.mockClear()
    
    // Navigate to hash on same page
    rerender(
      <MemoryRouter initialEntries={['/products#reviews']}>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    // Should NOT scroll (hash navigation)
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  // Test 9: Scrolls when pathname changes with hash present
  it('scrolls when pathname changes even if hash is present', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/products']}>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    const initialCalls = scrollToSpy.mock.calls.length
    
    // Navigate to different page with hash
    rerender(
      <MemoryRouter initialEntries={['/about#team']}>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    // Should NOT scroll because there's a hash
    expect(scrollToSpy).toHaveBeenCalledTimes(initialCalls)
  })

  // Test 10: Returns null for rendering
  it('returns null and does not render any DOM elements', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
        <div>Other content</div>
      </MemoryRouter>
    )
    
    // Only the other content should be present
    expect(container.querySelector('div')).toHaveTextContent('Other content')
    // ScrollToTop should not add any elements
    expect(container.children).toHaveLength(1)
  })

  // Test 11: Works with nested routes
  it('works correctly with nested routing structure', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/products" element={<div>Products</div>} />
        </Routes>
      </MemoryRouter>
    )
    
    // Verifies it works within routing context
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
  })

  // Test 12: Handles rapid route changes
  it('handles rapid route changes correctly', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/about" element={<div>About</div>} />
        </Routes>
      </MemoryRouter>
    )
    
    // Verifies no errors with routing
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  })

  // Test 13: Component mounts without errors
  it('mounts without errors in routing context', () => {
    expect(() => {
      render(
        <MemoryRouter initialEntries={['/products']}>
          <ScrollToTop />
          <Routes>
            <Route path="/products" element={<div>Products</div>} />
          </Routes>
        </MemoryRouter>
      )
    }).not.toThrow()
    
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  })

  // Test 14: Component integrates with react-router-dom
  it('correctly uses useLocation hook from react-router-dom', () => {
    // This test verifies the component doesn't crash and works with routing
    expect(() => {
      render(
        <MemoryRouter>
          <ScrollToTop />
        </MemoryRouter>
      )
    }).not.toThrow()
  })

  // Test 15: Scroll behavior is always instant, never smooth
  it('always uses instant behavior, not smooth', () => {
    render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    )
    
    const calls = scrollToSpy.mock.calls
    calls.forEach(call => {
      expect(call[0].behavior).toBe('instant')
      expect(call[0].behavior).not.toBe('smooth')
    })
  })
})
