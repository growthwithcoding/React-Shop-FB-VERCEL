// SearchBar.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// Controlled search input that pipes keystrokes up to the parent
// for product filtering. Optional debounced emit. Optional clear.
// NEW: You can wrap this in a <form> and submit it. If you pass
// a submit handler to that form, the header will render a button
// next to it (see NavBar).
// ------------------------------------------------------------
import { useEffect } from "react";

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(nextValue: string) => void} props.onChange
 * @param {(nextValue: string) => void} [props.onDebouncedChange]
 * @param {number} [props.debounceMs=0]
 * @param {string} [props.placeholder="Search products by title or description…"]
 * @param {string} [props.id]
 * @param {string} [props.name="search"]
 * @param {boolean} [props.autoFocus=false]
 * @param {string} [props.inputClassName="input"]
 * @param {string} [props.containerClassName=""]
 * @param {() => void} [props.onClear]
 * @param {string} [props.ariaLabel="Search products"]
 * @param {Object} [props.inputProps={}]
 */
export default function SearchBar({
  value,
  onChange,
  onDebouncedChange,
  debounceMs = 0,
  placeholder = "Search products by title or description…",
  id,
  name = "search",
  autoFocus = false,
  inputClassName = "input",
  containerClassName = "",
  onClear,
  ariaLabel = "Search products",
  inputProps = {},
}) {
  // Debounce (optional)
  useEffect(() => {
    if (!onDebouncedChange || debounceMs <= 0) return;
    const t = setTimeout(() => onDebouncedChange(value), debounceMs);
    return () => clearTimeout(t);
  }, [value, debounceMs, onDebouncedChange]);

  const showClear = !!value;

  return (
    <div
      role="search"
      className={containerClassName}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <input
        id={id}
        name={name}
        className={inputClassName}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        style={{ height: '40px', ...inputProps?.style }}
        {...inputProps}
      />

      {showClear && (
        <button
          type="button"
          aria-label="Clear search"
          title="Clear"
          onClick={() => {
            onChange("");
            onDebouncedChange?.("");
            onClear?.();
          }}
          className="search-clear"
        >
          ×
        </button>
      )}
    </div>
  );
}
