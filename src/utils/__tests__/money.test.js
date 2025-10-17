import { describe, it, expect } from 'vitest'
import { formatPrice } from '../money'

describe('Money Utility - formatPrice', () => {
  // Test 1: Formats standard prices correctly
  it('formats standard prices with two decimal places', () => {
    expect(formatPrice(29.99)).toBe('$29.99')
    expect(formatPrice(100)).toBe('$100.00')
    expect(formatPrice(0.99)).toBe('$0.99')
  })

  // Test 2: Handles integers by adding decimal places
  it('adds decimal places to whole numbers', () => {
    expect(formatPrice(50)).toBe('$50.00')
    expect(formatPrice(1000)).toBe('$1000.00')
  })

  // Test 3: Rounds to two decimal places
  it('rounds prices to two decimal places', () => {
    expect(formatPrice(29.999)).toBe('$30.00')
    expect(formatPrice(29.994)).toBe('$29.99')
    expect(formatPrice(0.996)).toBe('$1.00')
  })

  // Test 4: Handles zero
  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  // Test 5: Handles null and undefined
  it('handles null and undefined by defaulting to $0.00', () => {
    expect(formatPrice(null)).toBe('$0.00')
    expect(formatPrice(undefined)).toBe('$0.00')
  })

  // Test 6: Handles negative numbers
  it('formats negative prices correctly', () => {
    expect(formatPrice(-10.50)).toBe('$-10.50')
    expect(formatPrice(-100)).toBe('$-100.00')
  })

  // Test 7: Handles very small numbers
  it('formats very small numbers correctly', () => {
    expect(formatPrice(0.01)).toBe('$0.01')
    expect(formatPrice(0.001)).toBe('$0.00')
  })

  // Test 8: Handles very large numbers
  it('formats very large numbers correctly', () => {
    expect(formatPrice(999999.99)).toBe('$999999.99')
    expect(formatPrice(1000000)).toBe('$1000000.00')
  })

  // Test 9: Handles string inputs
  it('converts string numbers to formatted prices', () => {
    expect(formatPrice('29.99')).toBe('$29.99')
    expect(formatPrice('100')).toBe('$100.00')
  })

  // Test 10: Handles NaN and invalid strings
  it('converts NaN to $0.00 and invalid strings to $NaN', () => {
    // NaN is falsy, so (NaN || 0) becomes 0, resulting in $0.00
    expect(formatPrice(NaN)).toBe('$0.00')
    // 'invalid' is truthy, so ('invalid' || 0) stays 'invalid'
    // Number('invalid') = NaN, and NaN.toFixed(2) = "NaN"
    expect(formatPrice('invalid')).toBe('$NaN')
  })
})
