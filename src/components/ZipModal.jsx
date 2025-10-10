// src/components/ZipModal.jsx
// ------------------------------------------------------------
// WHAT THIS DOES (Option 2):
// Keeps your auto-populate behavior, but PAUSES lookups while the user is actively typing.
// After ~700ms of inactivity, lookups resume.
// ------------------------------------------------------------
// - Tracks a transient `isTyping` flag using a shared inactivity timer.
// - Skips ZIP->City/State and City/State->ZIP effects while `isTyping` is true.
// - Retains your ping-pong guard `lastSourceRef` and existing debounce helpers.
// - No UX surprises: manual keystrokes are never overwritten mid-typing.
// - No styling changes; your existing modal classes still work.
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(loc: { postal: string, city: string, region: string, country: string }) => void} props.onSave
 * @param {string}  [props.initialPostal]
 * @param {string}  [props.initialCity]
 * @param {string}  [props.initialRegion]  // 2-letter state for US
 * @param {string}  [props.initialCountry='US']
 */
export default function ZipModal({
  open,
  onClose,
  onSave,
  initialPostal = '',
  initialCity = '',
  initialRegion = '',
  initialCountry = 'US',
}) {
  const [postal, setPostal]   = useState(initialPostal)
  const [city, setCity]       = useState(initialCity)
  const [region, setRegion]   = useState(initialRegion)
  const [country, setCountry] = useState((initialCountry || 'US').toUpperCase())

  const [loadingZip, setLoadingZip]     = useState(false)
  const [loadingCity, setLoadingCity]   = useState(false)
  const [errorZip, setErrorZip]         = useState('')
  const [errorCity, setErrorCity]       = useState('')

  // Track last population source to prevent ping-pong effects
  // 'zip' = fields just set from ZIP lookup; 'citystate' vice-versa; 'user' = manual typing
  const lastSourceRef = useRef/** @type {('zip' | 'citystate' | 'user' | null)} */(null)

  // NEW: pause auto-lookup while typing
  const [isTyping, setIsTyping] = useState(false)
  const typingTimerRef = useRef/** @type {ReturnType<typeof setTimeout> | null} */(null)
  const TYPING_IDLE_MS = 1500

  const bumpTyping = () => {
    setIsTyping(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false)
      typingTimerRef.current = null
    }, TYPING_IDLE_MS)
  }

  // Reset fields when modal opens
  useEffect(() => {
    if (!open) return
    setPostal(initialPostal || '')
    setCity(initialCity || '')
    setRegion(initialRegion || '')
    setCountry((initialCountry || 'US').toUpperCase())
    setErrorZip('')
    setErrorCity('')
    lastSourceRef.current = null
    setIsTyping(false)
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }
  }, [open, initialPostal, initialCity, initialRegion, initialCountry])

  // Basic checks
  const isUS = useMemo(() => (country || 'US').toUpperCase() === 'US', [country])
  const looksLikeUSZip = useMemo(
    () => /^[0-9]{5}(?:-[0-9]{4})?$/.test((postal || '').trim()),
    [postal]
  )
  const hasCityState = useMemo(
    () => (city || '').trim().length >= 2 && /^[A-Za-z]{2}$/.test((region || '').trim()),
    [city, region]
  )

  // --- Debounce helper (preserved)
  function useDebounced(value, delayMs) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delayMs)
      return () => clearTimeout(t)
    }, [value, delayMs])
    return debounced
  }
  const debPostal = useDebounced(postal, 350)
  const debCity   = useDebounced(city, 400)
  const debRegion = useDebounced(region, 400)

  // ZIP -> City/State/Country (US)
  useEffect(() => {
    let ignore = false

    async function lookupByZip() {
      setErrorZip('')
      setLoadingZip(true)
      try {
        const zip5 = debPostal.substring(0, 5)
        const res = await fetch(`https://api.zippopotam.us/us/${zip5}`)
        if (!res.ok) throw new Error('ZIP lookup failed')
        const data = await res.json()
        const place = data?.places?.[0]
        if (!ignore && place) {
          lastSourceRef.current = 'zip'
          setCity(place['place name'] || '')
          setRegion(place['state abbreviation'] || '')
          setCountry((data?.countryAbbreviation || 'US').toUpperCase())
        }
      } catch {
        if (!ignore) {
          setErrorZip('Could not auto-detect city/state from this ZIP. You can fill them manually.')
        }
      } finally {
        if (!ignore) setLoadingZip(false)
      }
    }

    // Trigger rules:
    // - modal open, country is US
    // - postal looks like a US ZIP
    // - NOT currently typing
    // - prevent immediate ping-pong after a city/state-derived update
    if (open && isUS && !isTyping && looksLikeUSZip && lastSourceRef.current !== 'citystate') {
      lookupByZip()
    }

    return () => { ignore = true }
  }, [open, isUS, isTyping, looksLikeUSZip, debPostal])

  // City/State -> ZIP (US; best guess from first result)
  useEffect(() => {
    let ignore = false

    async function lookupByCityState() {
      setErrorCity('')
      setLoadingCity(true)
      try {
        const state2 = debRegion.toUpperCase()
        const safeCity = encodeURIComponent(debCity.trim())
        const res = await fetch(`https://api.zippopotam.us/us/${state2}/${safeCity}`)
        if (!res.ok) throw new Error('City/State lookup failed')
        const data = await res.json()
        const place = data?.places?.[0]
        if (!ignore && place) {
          const nextZip = place['post code'] || ''
          if (nextZip) {
            lastSourceRef.current = 'citystate'
            setPostal(nextZip)
            setCountry((data?.countryAbbreviation || 'US').toUpperCase())
          }
        }
      } catch {
        if (!ignore) {
          setErrorCity('Could not auto-detect ZIP for this City/State. Please enter it manually.')
        }
      } finally {
        if (!ignore) setLoadingCity(false)
      }
    }

    // Trigger rules:
    // - modal open, country is US
    // - both city and 2-letter state provided
    // - NOT currently typing
    // - avoid immediate ping-pong after a ZIP-derived update
    if (open && isUS && !isTyping && hasCityState && lastSourceRef.current !== 'zip') {
      // Only attempt if postal is empty or doesn't look like a proper ZIP yet
      if (!looksLikeUSZip) lookupByCityState()
    }

    return () => { ignore = true }
  }, [open, isUS, isTyping, hasCityState, debCity, debRegion, looksLikeUSZip])

  if (!open) return null

  return (
    <div 
      className="modal-backdrop" 
      role="dialog" 
      aria-modal="true" 
      aria-label="Update delivery location"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Update Delivery Location</h3>

        <div className="zip-grid">
          {/* Postal / ZIP */}
          <label className="zip-field">
            <span className="zip-label">ZIP / Postal Code</span>
            <input
              className="input"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="e.g. 84629"
              value={postal}
              onChange={(event) => {
                lastSourceRef.current = 'user' // mark manual edit
                bumpTyping()
                setPostal(event.target.value)
              }}
            />
            {loadingZip && <small className="meta">Looking up city…</small>}
            {!!errorZip && <div className="toast error" style={{position:'static', marginTop:6}}>{errorZip}</div>}
          </label>

          {/* Country (kept simple; default US) */}
          <label className="zip-field">
            <span className="zip-label">Country</span>
            <select
              className="select"
              value={country}
              onChange={(event) => {
                lastSourceRef.current = 'user'
                bumpTyping()
                setCountry(event.target.value)
              }}
            >
              <option value="US">United States</option>
              {/* Extend here to add more countries + lookup logic */}
            </select>
          </label>

          {/* City (auto from ZIP; editable; triggers ZIP lookup when paired with State) */}
          <label className="zip-field">
            <span className="zip-label">City</span>
            <input
              className="input"
              placeholder="Auto-filled from ZIP or type to search"
              value={city}
              onChange={(event) => {
                lastSourceRef.current = 'user'
                bumpTyping()
                setCity(event.target.value)
              }}
            />
          </label>

          {/* State/Region (US 2-letter) */}
          <label className="zip-field">
            <span className="zip-label">State / Region</span>
            <input
              className="input"
              placeholder="UT"
              value={region}
              onChange={(event) => {
                lastSourceRef.current = 'user'
                bumpTyping()
                setRegion(event.target.value.toUpperCase())
              }}
            />
          </label>
        </div>

        <div className="meta" style={{marginTop:8}}>
          {loadingCity ? 'Looking up ZIP…' : 'Tip: type a 5-digit ZIP or enter City + 2-letter State.'}
        </div>
        {!!errorCity && <div className="toast error" style={{position:'static', marginTop:8}}>{errorCity}</div>}

        <div className="actions" style={{marginTop:12}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={()=>{
              const payload = {
                postal: (postal || '').trim(),
                city: (city || '').trim(),
                region: (region || '').trim(),
                country: (country || 'US').toUpperCase(),
              }
              onSave?.(payload)
            }}
            disabled={!postal && !(city && region)}
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  )
}
