import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../Pagination'

describe('Pagination Component - Unit Tests', () => {
  let mockOnPageChange
  let mockOnItemsPerPageChange

  beforeEach(() => {
    mockOnPageChange = vi.fn()
    mockOnItemsPerPageChange = vi.fn()
  })

  // Test 1: Basic rendering
  it('renders pagination with correct info', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    expect(screen.getByText('1-10 of 100')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 10')).toBeInTheDocument()
  })

  // Test 2: Items per page selector
  it('displays items per page selector with options', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('10')
    expect(screen.getByText('10 per page')).toBeInTheDocument()
  })

  // Test 3: Change items per page
  it('calls onItemsPerPageChange when selection changes', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '25' } })

    expect(mockOnItemsPerPageChange).toHaveBeenCalledWith(25)
  })

  // Test 4: Previous button disabled on first page
  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const prevButton = screen.getByLabelText('Previous page')
    expect(prevButton).toBeDisabled()
    
    fireEvent.click(prevButton)
    expect(mockOnPageChange).not.toHaveBeenCalled()
  })

  // Test 5: Next button disabled on last page
  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const nextButton = screen.getByLabelText('Next page')
    expect(nextButton).toBeDisabled()
    
    fireEvent.click(nextButton)
    expect(mockOnPageChange).not.toHaveBeenCalled()
  })

  // Test 6: Previous button navigates correctly
  it('navigates to previous page when previous button is clicked', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const prevButton = screen.getByLabelText('Previous page')
    fireEvent.click(prevButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(4)
  })

  // Test 7: Next button navigates correctly
  it('navigates to next page when next button is clicked', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const nextButton = screen.getByLabelText('Next page')
    fireEvent.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(6)
  })

  // Test 8: Direct page number click
  it('navigates to selected page when page number is clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const pageButton = screen.getByRole('button', { name: '3' })
    fireEvent.click(pageButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  // Test 9: Current page is highlighted
  it('highlights the current page button', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const currentPageButton = screen.getByRole('button', { name: '3' })
    expect(currentPageButton).toHaveStyle({ background: '#febd69' })
  })

  // Test 10: Shows all pages when total is <= 7
  it('displays all page numbers when total pages is 7 or less', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
    }
    expect(screen.queryByText('...')).not.toBeInTheDocument()
  })

  // Test 11: Shows ellipsis for many pages (beginning)
  it('shows ellipsis when on early pages with many total pages', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={20}
        onPageChange={mockOnPageChange}
        totalItems={200}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument()
  })

  // Test 12: Shows ellipsis for many pages (middle)
  it('shows ellipsis on both sides when in middle of many pages', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={20}
        onPageChange={mockOnPageChange}
        totalItems={200}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const ellipses = screen.getAllByText('...')
    expect(ellipses).toHaveLength(2) // One before and one after
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument()
  })

  // Test 13: Shows ellipsis for many pages (end)
  it('shows ellipsis when on late pages with many total pages', () => {
    render(
      <Pagination
        currentPage={18}
        totalPages={20}
        onPageChange={mockOnPageChange}
        totalItems={200}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument()
  })

  // Test 14: Calculates item range correctly
  it('calculates and displays correct item range', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    expect(screen.getByText('21-30 of 100')).toBeInTheDocument()
  })

  // Test 15: Handles last page partial items correctly
  it('displays correct range on last page with partial items', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={47}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    // Page 5: items 41-47 (not 41-50)
    expect(screen.getByText('41-47 of 47')).toBeInTheDocument()
  })

  // Test 16: Previous button on page 2
  it('goes to page 1 when clicking previous from page 2', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const prevButton = screen.getByLabelText('Previous page')
    fireEvent.click(prevButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(1)
  })

  // Test 17: Next button on second-to-last page
  it('goes to last page when clicking next from second-to-last page', () => {
    render(
      <Pagination
        currentPage={9}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const nextButton = screen.getByLabelText('Next page')
    fireEvent.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(10)
  })

  // Test 18: Single page scenario
  it('handles single page correctly', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
        totalItems={5}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    expect(screen.getByText('1-5 of 5')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    
    const prevButton = screen.getByLabelText('Previous page')
    const nextButton = screen.getByLabelText('Next page')
    
    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  // Test 19: All items per page options available
  it('provides all items per page options', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={mockOnPageChange}
        totalItems={1000}
        itemsPerPage={10}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const select = screen.getByRole('combobox')
    const options = select.querySelectorAll('option')
    
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveValue('10')
    expect(options[1]).toHaveValue('25')
    expect(options[2]).toHaveValue('50')
    expect(options[3]).toHaveValue('100')
  })

  // Test 20: Page range with 25 items per page
  it('calculates range correctly with 25 items per page', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={4}
        onPageChange={mockOnPageChange}
        totalItems={100}
        itemsPerPage={25}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    expect(screen.getByText('26-50 of 100')).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 4')).toBeInTheDocument()
  })
})
