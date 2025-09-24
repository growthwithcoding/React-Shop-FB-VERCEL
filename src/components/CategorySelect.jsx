// CategorySelect.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// Dynamic category dropdown (React Query). Emits the canonical value,
// then sets the URL hash so the browser scrolls to the Hero. The
// CSS (scroll-margin-top) handles the sticky-header offset.
// ------------------------------------------------------------

import { useQuery } from '@tanstack/react-query'
import { getCategories, normalizeCategory, categoryLabel } from '../api/fakestore.js'

export default function CategorySelect({ value = 'all', onChange }) {
  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  if (isLoading) {
    return (
      <select disabled aria-label="Choose a category">
        <option>Loading...</option>
      </select>
    )
  }
  if (isError) {
    return (
      <select disabled aria-label="Choose a category">
        <option>Error</option>
      </select>
    )
  }

  const selected = normalizeCategory(value)

  return (
    <select
      value={selected}
      onChange={(e) => {
        // 1) Normalize + bubble up (parent updates search params / triggers fetch)
        const next = normalizeCategory(e.target.value)
        onChange(next)
      }}
      aria-label="Choose a category"
    >
      <option value="all">{categoryLabel('all')}</option>
      {categories.map((raw) => {
        const c = normalizeCategory(raw)
        if (c === 'all') return null
        return (
          <option key={c} value={c}>
            {categoryLabel(c)}
          </option>
        )
      })}
    </select>
  )
}
