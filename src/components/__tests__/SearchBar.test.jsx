import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from '../SearchBar'

describe('SearchBar Component - Unit Tests', () => {
  let mockOnChange
  let mockOnDebouncedChange
  let mockOnClear

  beforeEach(() => {
    mockOnChange = vi.fn()
    mockOnDebouncedChange = vi.fn()
    mockOnClear = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // Test 1: Renders with default props
  it('renders with default placeholder and empty value', () => {
    render(<SearchBar value="" onChange={mockOnChange} />)

    const input = screen.getByRole('searchbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Search products by title or description…')
    expect(input).toHaveValue('')
  })

  // Test 2: Displays provided value
  it('displays the provided value', () => {
    render(<SearchBar value="test query" onChange={mockOnChange} />)

    const input = screen.getByRole('searchbox')
    expect(input).toHaveValue('test query')
  })

  // Test 3: Calls onChange when typing
  it('calls onChange handler when user types', () => {
    render(<SearchBar value="" onChange={mockOnChange} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'laptop' } })

    expect(mockOnChange).toHaveBeenCalledWith('laptop')
  })

  // Test 4: Shows clear button when value is not empty
  it('shows clear button when input has value', () => {
    render(<SearchBar value="test" onChange={mockOnChange} />)

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()
  })

  // Test 5: Does not show clear button when empty
  it('does not show clear button when input is empty', () => {
    render(<SearchBar value="" onChange={mockOnChange} />)

    const clearButton = screen.queryByRole('button', { name: /clear search/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  // Test 6: Clear button clears the input
  it('clears input when clear button is clicked', () => {
    render(<SearchBar value="test query" onChange={mockOnChange} onClear={mockOnClear} />)

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clearButton)

    expect(mockOnChange).toHaveBeenCalledWith('')
    expect(mockOnClear).toHaveBeenCalled()
  })

  // Test 7: Debounced change works correctly
  it('calls onDebouncedChange after debounce delay', () => {
    render(
      <SearchBar
        value="test"
        onChange={mockOnChange}
        onDebouncedChange={mockOnDebouncedChange}
        debounceMs={300}
      />
    )

    // Should not be called immediately
    expect(mockOnDebouncedChange).not.toHaveBeenCalled()

    // Fast-forward time
    vi.advanceTimersByTime(300)

    expect(mockOnDebouncedChange).toHaveBeenCalledWith('test')
  })

  // Test 8: Debounce resets on value change
  it('resets debounce timer when value changes', () => {
    const { rerender } = render(
      <SearchBar
        value="a"
        onChange={mockOnChange}
        onDebouncedChange={mockOnDebouncedChange}
        debounceMs={300}
      />
    )

    vi.advanceTimersByTime(200)

    // Change value before debounce completes
    rerender(
      <SearchBar
        value="ab"
        onChange={mockOnChange}
        onDebouncedChange={mockOnDebouncedChange}
        debounceMs={300}
      />
    )

    vi.advanceTimersByTime(200)
    expect(mockOnDebouncedChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(mockOnDebouncedChange).toHaveBeenCalledWith('ab')
  })

  // Test 9: Custom placeholder works
  it('displays custom placeholder text', () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        placeholder="Find your product..."
      />
    )

    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('placeholder', 'Find your product...')
  })

  // Test 10: Custom aria-label works
  it('uses custom aria-label for accessibility', () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        ariaLabel="Search all products"
      />
    )

    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('aria-label', 'Search all products')
  })

  // Test 11: AutoFocus works
  it('autofocuses input when autoFocus is true', () => {
    render(<SearchBar value="" onChange={mockOnChange} autoFocus={true} />)

    const input = screen.getByRole('searchbox')
    expect(input).toHaveFocus()
  })

  // Test 12: Name attribute is set
  it('sets name attribute correctly', () => {
    render(<SearchBar value="" onChange={mockOnChange} name="productSearch" />)

    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('name', 'productSearch')
  })

  // Test 13: ID attribute is set
  it('sets id attribute when provided', () => {
    render(<SearchBar value="" onChange={mockOnChange} id="main-search" />)

    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('id', 'main-search')
  })

  // Test 14: Search role is present
  it('has search role for accessibility', () => {
    render(<SearchBar value="" onChange={mockOnChange} />)

    const searchContainer = screen.getByRole('search')
    expect(searchContainer).toBeInTheDocument()
  })

  // Test 15: Clear button calls onDebouncedChange
  it('calls onDebouncedChange with empty string when cleared', () => {
    render(
      <SearchBar
        value="test"
        onChange={mockOnChange}
        onDebouncedChange={mockOnDebouncedChange}
        debounceMs={0}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clearButton)

    expect(mockOnDebouncedChange).toHaveBeenCalledWith('')
  })
})
